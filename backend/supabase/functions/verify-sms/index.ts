// SMS 인증코드 확인 Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifySmsRequest {
  phone: string;
  code: string;
  purpose: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET';
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
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

    const { phone, code, purpose }: VerifySmsRequest = await req.json();
    const normalizedPhone = normalizePhone(phone);

    // 1. 인증 코드 조회
    const { data: verification, error: selectError } = await supabase
      .from('sms_verifications')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('purpose', purpose)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (selectError || !verification) {
      return new Response(
        JSON.stringify({ error: '인증 요청을 찾을 수 없습니다. 인증코드를 다시 요청해주세요.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 만료 시간 확인
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: '인증코드가 만료되었습니다. 다시 요청해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 시도 횟수 확인 (최대 5회)
    if (verification.attempts >= 5) {
      return new Response(
        JSON.stringify({ error: '인증 시도 횟수를 초과했습니다. 인증코드를 다시 요청해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 인증코드 확인
    if (verification.code !== code) {
      // 시도 횟수 증가
      await supabase
        .from('sms_verifications')
        .update({ attempts: verification.attempts + 1 })
        .eq('id', verification.id);

      const remainingAttempts = 5 - (verification.attempts + 1);
      return new Response(
        JSON.stringify({
          error: `인증코드가 일치하지 않습니다. (${remainingAttempts}회 남음)`,
          remainingAttempts,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 인증 성공 처리
    await supabase
      .from('sms_verifications')
      .update({ verified: true })
      .eq('id', verification.id);

    // 6. 기존 사용자 조회 (INACTIVE 상태 체크)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, status, company_id, companies(name)')
      .eq('phone', normalizedPhone)
      .single();

    // 7. 인증 토큰 생성 (회원가입/비밀번호 재설정 시 사용)
    // 간단한 토큰: phone + timestamp를 Base64 인코딩
    const verificationToken = btoa(JSON.stringify({
      phone: normalizedPhone,
      purpose: purpose,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10분 유효
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: '인증이 완료되었습니다.',
        verificationToken,
        // INACTIVE 상태의 기존 사용자 정보 전달 (클라이언트에서 이직 안내 표시)
        existingUser: existingUser?.status === 'INACTIVE' ? {
          id: existingUser.id,
          status: existingUser.status,
          companyName: existingUser.companies?.name || '이전 회사'
        } : null
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
