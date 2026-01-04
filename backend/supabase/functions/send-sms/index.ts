// SMS 인증코드 발송 Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSmsRequest {
  phone: string;
  purpose: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET';
}

// 6자리 인증코드 생성
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 전화번호 정규화 (숫자만 추출)
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

    const { phone, purpose }: SendSmsRequest = await req.json();

    // 1. 전화번호 유효성 검사
    const normalizedPhone = normalizePhone(phone);
    if (!/^01[0-9]{8,9}$/.test(normalizedPhone)) {
      return new Response(
        JSON.stringify({ error: '올바른 휴대폰 번호를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 목적별 검증
    if (purpose === 'SIGNUP') {
      // 회원가입: 이미 등록된 번호인지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: '이미 가입된 휴대폰 번호입니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (purpose === 'LOGIN' || purpose === 'PASSWORD_RESET') {
      // 로그인/비밀번호 재설정: 등록된 번호인지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();

      if (!existingUser) {
        return new Response(
          JSON.stringify({ error: '등록되지 않은 휴대폰 번호입니다.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. 기존 미사용 인증코드 무효화
    await supabase
      .from('sms_verifications')
      .delete()
      .eq('phone', normalizedPhone)
      .eq('purpose', purpose)
      .eq('verified', false);

    // 4. 새 인증코드 생성
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3분 후 만료

    // 5. DB에 저장
    const { error: insertError } = await supabase
      .from('sms_verifications')
      .insert({
        phone: normalizedPhone,
        code: code,
        purpose: purpose,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: '인증코드 생성 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. SMS 발송 (실제 구현 시 NHN Cloud 또는 Twilio 연동)
    // TODO: 실제 SMS API 연동
    const smsApiKey = Deno.env.get('SMS_API_KEY');
    const smsApiSecret = Deno.env.get('SMS_API_SECRET');
    const smsSendNumber = Deno.env.get('SMS_SEND_NUMBER');

    if (smsApiKey && smsApiSecret && smsSendNumber) {
      // 실제 SMS 발송 로직 (NHN Cloud Toast SMS 예시)
      // const smsResult = await sendSmsViaNHN(normalizedPhone, code);
      console.log(`[SMS 발송] ${normalizedPhone}: ${code}`);
    } else {
      // 개발 환경: 콘솔에만 출력
      console.log(`[개발모드] SMS 인증코드: ${normalizedPhone} -> ${code}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '인증코드가 발송되었습니다.',
        // 개발 환경에서만 코드 반환 (프로덕션에서는 제거)
        ...(Deno.env.get('ENVIRONMENT') !== 'production' && { code }),
        expiresIn: 180, // 3분 (초)
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
