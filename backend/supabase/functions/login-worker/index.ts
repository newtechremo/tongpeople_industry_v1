// 근로자 로그인 Edge Function
// 비밀번호 또는 SMS 인증으로 로그인
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateTokens } from '../_shared/jwt.ts';
import { handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';

interface LoginWorkerRequest {
  phone: string;
  // 비밀번호 로그인
  password?: string;
  // SMS 로그인
  smsCode?: string;
  // 로그인 타입
  loginType: 'PASSWORD' | 'SMS';
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

Deno.serve(async (req) => {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const data: LoginWorkerRequest = await req.json();

    // 전화번호 정규화
    const normalizedPhone = normalizePhone(data.phone || '');
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return errorResponse('INVALID_PHONE_NUMBER', '올바른 전화번호를 입력해주세요.');
    }

    // 1. 사용자 조회 (phone으로)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, phone, status, company_id, site_id, partner_id, role')
      .eq('phone', normalizedPhone)
      .single();

    if (userError || !user) {
      return errorResponse('USER_NOT_FOUND', '등록되지 않은 전화번호입니다.');
    }

    // 2. 상태 확인
    if (user.status === 'BLOCKED') {
      return errorResponse('FORBIDDEN', '차단된 계정입니다. 관리자에게 문의하세요.');
    }

    if (user.status === 'INACTIVE') {
      return errorResponse('WORKER_NOT_ACTIVE', '비활성화된 계정입니다.');
    }

    // 3. 로그인 타입에 따라 처리
    if (data.loginType === 'PASSWORD') {
      // 비밀번호 로그인
      if (!data.password) {
        return errorResponse('INVALID_PASSWORD', '비밀번호를 입력해주세요.');
      }

      // Supabase Auth로 비밀번호 검증
      const fakeEmail = `${normalizedPhone}@phone.tongpass.local`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: data.password,
      });

      if (authError || !authData.user) {
        console.error('Password auth error:', authError);
        return errorResponse('INVALID_PASSWORD', '전화번호 또는 비밀번호가 일치하지 않습니다.');
      }

      // Auth의 user.id와 users 테이블의 id가 일치하는지 확인
      if (authData.user.id !== user.id) {
        console.error('User ID mismatch:', { authId: authData.user.id, userId: user.id });
        // ID가 다른 경우 users 테이블 기준으로 처리
      }

    } else if (data.loginType === 'SMS') {
      // SMS 로그인
      if (!data.smsCode || data.smsCode.length !== 6) {
        return errorResponse('INVALID_CODE', '6자리 인증번호를 입력해주세요.');
      }

      // SMS 인증 코드 검증 (sms_verifications 테이블)
      const { data: smsRecord, error: smsError } = await supabase
        .from('sms_verifications')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('code', data.smsCode)
        .eq('purpose', 'LOGIN')
        .eq('verified', false)
        .single();

      if (smsError || !smsRecord) {
        return errorResponse('INVALID_CODE', '인증번호가 일치하지 않습니다.');
      }

      // 만료 확인
      if (new Date(smsRecord.expires_at) < new Date()) {
        return errorResponse('CODE_EXPIRED', '인증번호가 만료되었습니다.');
      }

      // 인증 완료 처리
      await supabase
        .from('sms_verifications')
        .update({ verified: true })
        .eq('id', smsRecord.id);

    } else {
      return errorResponse('UNKNOWN_ERROR', '로그인 타입을 지정해주세요.');
    }

    // 4. JWT 토큰 생성
    const tokens = await generateTokens(user.id, supabase);

    // 5. 성공 응답
    return successResponse({
      message: '로그인 성공',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      workerId: user.id,
      status: user.status,
      name: user.name,
    });

  } catch (error) {
    return serverError(error);
  }
});
