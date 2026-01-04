// 비밀번호 재설정 Edge Function
// SMS 인증 후 새 비밀번호 설정
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  verificationToken: string;  // verify-sms에서 받은 토큰
  phone: string;
  newPassword: string;
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

    const { verificationToken, phone, newPassword }: ResetPasswordRequest = await req.json();
    const normalizedPhone = normalizePhone(phone);

    // 1. 인증 토큰 검증
    try {
      const tokenData = JSON.parse(atob(verificationToken));

      if (tokenData.phone !== normalizedPhone) {
        return new Response(
          JSON.stringify({ error: '인증 정보가 일치하지 않습니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (tokenData.expiresAt < Date.now()) {
        return new Response(
          JSON.stringify({ error: '인증이 만료되었습니다. 처음부터 다시 진행해주세요.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (tokenData.purpose !== 'PASSWORD_RESET') {
        return new Response(
          JSON.stringify({ error: '잘못된 인증 토큰입니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증 토큰입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 비밀번호 유효성 검사
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: '비밀번호는 8자 이상이어야 합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 사용자 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('phone', normalizedPhone)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(
        JSON.stringify({ error: '비밀번호 변경 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.',
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
