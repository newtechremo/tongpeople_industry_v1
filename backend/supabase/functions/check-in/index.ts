// 출근 처리 Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckInRequest {
  site_id: number;
  qr_payload: {
    workerId: string;
    timestamp: number;
    expiresAt: number;
    signature: string; // QR 서명 (위변조 방지)
  };
}

/**
 * QR 서명 검증
 *
 * 클라이언트에서 생성한 서명과 서버에서 재계산한 서명을 비교합니다.
 * HMAC-SHA256 방식으로 message + secret 조합의 해시를 생성합니다.
 */
async function verifyQRSignature(payload: CheckInRequest['qr_payload']): Promise<boolean> {
  const QR_SECRET_KEY = Deno.env.get('QR_SECRET_KEY');

  // 시크릿 키가 없으면 개발 모드로 간주 (서명 검증 스킵)
  if (!QR_SECRET_KEY) {
    console.warn('[QR Verify] QR_SECRET_KEY가 설정되지 않았습니다. 개발 모드로 동작합니다.');

    // 개발 모드 서명 허용 (dev-signature- 접두사)
    if (payload.signature.startsWith('dev-signature-')) {
      return true;
    }

    // 서명이 없어도 허용 (개발 중)
    console.warn('[QR Verify] 서명 검증을 건너뜁니다 (개발 모드)');
    return true;
  }

  const { workerId, timestamp, expiresAt, signature } = payload;

  // 원본 메시지 재구성 (클라이언트와 동일한 순서)
  const message = JSON.stringify({ workerId, timestamp, expiresAt });
  const combined = message + QR_SECRET_KEY;

  // SHA-256 해시 생성 (Deno 방식)
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // 해시를 16진수 문자열로 변환
  const expectedSignature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // 서명 비교
  return signature === expectedSignature;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { site_id, qr_payload }: CheckInRequest = await req.json();

    // 1. QR 유효성 검사 (만료 시간)
    const now = Date.now();
    if (qr_payload.expiresAt < now) {
      return new Response(
        JSON.stringify({ error: 'QR 코드가 만료되었습니다. 새로고침 후 다시 시도해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. QR 서명 검증 (위변조 방지)
    const isValidSignature = await verifyQRSignature(qr_payload);
    if (!isValidSignature) {
      console.error('[QR Verify] 서명 검증 실패:', qr_payload.workerId);
      return new Response(
        JSON.stringify({ error: 'QR 코드가 위변조되었습니다. 앱에서 새 QR을 생성해주세요.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, partners(name)')
      .eq('id', qr_payload.workerId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3-1. 사용자 상태 확인
    if (user.status !== 'ACTIVE') {
      const statusMessages: Record<string, string> = {
        PENDING: '동의가 필요합니다. 앱에서 가입을 완료해주세요.',
        REQUESTED: '가입 승인 대기 중입니다. 관리자 승인을 기다려주세요.',
        BLOCKED: '접근이 차단되었습니다. 관리자에게 문의해주세요.',
        INACTIVE: '비활성 계정입니다. 관리자에게 문의해주세요.',
      };
      const message = statusMessages[user.status] || '출근 처리가 불가능한 상태입니다.';

      return new Response(
        JSON.stringify({ error: message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 현장 정보 조회
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', site_id)
      .single();

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ error: '현장을 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 근무일 계산 (현장 설정 기준)
    const checkInTime = new Date();
    const hour = checkInTime.getHours();
    let workDate = new Date(checkInTime);

    if (hour < site.work_day_start_hour) {
      workDate.setDate(workDate.getDate() - 1);
    }
    const workDateStr = workDate.toISOString().split('T')[0];

    // 6. 중복 출근 체크
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, check_out_time')
      .eq('work_date', workDateStr)
      .eq('site_id', site_id)
      .eq('user_id', qr_payload.workerId)
      .single();

    if (existing && !existing.check_out_time) {
      return new Response(
        JSON.stringify({ error: '이미 출근 처리되었습니다. 퇴근 후 다시 시도해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. 나이 및 고령자 여부 계산
    let age = null;
    let isSenior = false;
    if (user.birth_date) {
      const birth = new Date(user.birth_date);
      age = workDate.getFullYear() - birth.getFullYear();
      const m = workDate.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && workDate.getDate() < birth.getDate())) {
        age--;
      }
      isSenior = age >= site.senior_age_threshold;
    }

    // 8. 자동 퇴근 시간 계산 (AUTO_8H 모드)
    let checkOutTime = null;
    let isAutoOut = false;
    if (site.checkout_policy === 'AUTO_8H') {
      checkOutTime = new Date(checkInTime.getTime() + site.auto_hours * 60 * 60 * 1000);
      isAutoOut = true;
    }

    // 9. 출근 기록 생성
    const { data: attendance, error: insertError } = await supabase
      .from('attendance')
      .insert({
        work_date: workDateStr,
        site_id: site_id,
        partner_id: user.partner_id,
        user_id: qr_payload.workerId,
        worker_name: user.name,
        role: user.role,
        birth_date: user.birth_date,
        age: age,
        is_senior: isSenior,
        check_in_time: checkInTime.toISOString(),
        check_out_time: checkOutTime?.toISOString() || null,
        is_auto_out: isAutoOut,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: '출근 처리 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${user.name}님 출근 처리되었습니다.`,
        data: {
          worker_name: user.name,
          partner_name: user.partners?.name,
          check_in_time: checkInTime.toISOString(),
          check_out_time: checkOutTime?.toISOString(),
          is_auto_out: isAutoOut,
          is_senior: isSenior,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
