// 근로자 QR 페이로드 생성 Edge Function
// 관리자가 스캔할 QR 코드 데이터를 서버에서 안전하게 생성
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAccessToken } from '../_shared/jwt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// QR 유효 기간 (밀리초)
const QR_EXPIRATION_MS = 30000; // 30초

/**
 * QR 서명 생성
 * HMAC-SHA256 방식으로 message + secret 조합의 해시를 생성
 */
async function generateQRSignature(
  workerId: string,
  timestamp: number,
  expiresAt: number
): Promise<string> {
  const QR_SECRET_KEY = Deno.env.get('QR_SECRET_KEY');

  // 시크릿 키가 없으면 개발 모드 서명 반환
  if (!QR_SECRET_KEY) {
    console.warn('[QR Generate] QR_SECRET_KEY가 설정되지 않았습니다. 개발 모드로 동작합니다.');
    return `dev-signature-${workerId}-${timestamp}`;
  }

  // 원본 메시지 구성 (check-in API와 동일한 순서)
  const message = JSON.stringify({ workerId, timestamp, expiresAt });
  const combined = message + QR_SECRET_KEY;

  // SHA-256 해시 생성
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Hex 문자열로 변환
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

    // Authorization 헤더에서 JWT 토큰 추출
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Service Role 클라이언트 (DB 쿼리용)
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. 커스텀 JWT 검증
    const userId = await verifyAccessToken(token);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증 토큰입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 사용자 상태 확인 (ACTIVE만 QR 생성 가능)
    const { data: workerData, error: workerError } = await supabaseAdmin
      .from('users')
      .select('id, status, name')
      .eq('id', userId)
      .single();

    if (workerError || !workerData) {
      return new Response(
        JSON.stringify({ error: '사용자 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (workerData.status !== 'ACTIVE') {
      const statusMessages: Record<string, string> = {
        PENDING: '동의가 필요합니다.',
        REQUESTED: '가입 승인 대기 중입니다.',
        BLOCKED: '접근이 차단되었습니다.',
        INACTIVE: '비활성 계정입니다.',
        REJECTED: '가입이 반려되었습니다.',
      };
      const message = statusMessages[workerData.status] || 'QR 코드를 생성할 수 없는 상태입니다.';

      return new Response(
        JSON.stringify({ error: message, status: workerData.status }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. QR 페이로드 생성
    const now = Date.now();
    const timestamp = now;
    const expiresAt = now + QR_EXPIRATION_MS;

    // 4. 서명 생성
    const signature = await generateQRSignature(userId, timestamp, expiresAt);

    // 5. 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          workerId: userId,
          timestamp: timestamp,
          expiresAt: expiresAt,
          signature: signature,
          expiresInSeconds: QR_EXPIRATION_MS / 1000,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
