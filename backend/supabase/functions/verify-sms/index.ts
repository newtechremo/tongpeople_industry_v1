// SMS 인증코드 확인 Edge Function
// 모바일 앱 호환 응답 형식 지원
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateTokens } from '../_shared/jwt.ts';
import { handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';

interface VerifySmsRequest {
  phone: string;
  code: string;
  purpose: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET';
}

interface PreRegisteredData {
  name: string;
  birthDate: string;
  gender: string;
  nationality: string;
  teamId: string;  // ID는 string으로 통일
  teamName?: string;
  jobTitle: string;
  preRegistered: true;
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// 생년월일 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
function formatBirthDateToCompact(birthDate: string | null): string {
  if (!birthDate) return '';
  return birthDate.replace(/-/g, '');
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
      return errorResponse('NOT_FOUND', '인증 요청을 찾을 수 없습니다. 인증코드를 다시 요청해주세요.', 404);
    }

    // 2. 만료 시간 확인
    if (new Date(verification.expires_at) < new Date()) {
      return errorResponse('CODE_EXPIRED', '인증코드가 만료되었습니다. 다시 요청해주세요.');
    }

    // 3. 시도 횟수 확인 (최대 5회)
    if (verification.attempts >= 5) {
      return errorResponse('TOO_MANY_REQUESTS', '인증 시도 횟수를 초과했습니다. 인증코드를 다시 요청해주세요.');
    }

    // 4. 인증코드 확인
    if (verification.code !== code) {
      // 시도 횟수 증가
      await supabase
        .from('sms_verifications')
        .update({ attempts: verification.attempts + 1 })
        .eq('id', verification.id);

      const remainingAttempts = 5 - (verification.attempts + 1);
      return errorResponse(
        'INVALID_CODE',
        `인증코드가 일치하지 않습니다. (${remainingAttempts}회 남음)`,
        400,
        { remainingAttempts }
      );
    }

    // 5. 인증 성공 처리
    await supabase
      .from('sms_verifications')
      .update({ verified: true })
      .eq('id', verification.id);

    // 6. 기존 사용자 조회 (모든 상태)
    const { data: existingUser } = await supabase
      .from('users')
      .select(`
        id, name, status, site_id, partner_id, company_id,
        birth_date, gender, nationality, job_title, pre_registered,
        companies(name),
        partners(id, name)
      `)
      .eq('phone', normalizedPhone)
      .single();

    // 7. 인증 토큰 생성 (회원가입/비밀번호 재설정 시 사용)
    const verificationToken = btoa(JSON.stringify({
      phone: normalizedPhone,
      purpose: purpose,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10분 유효
    }));

    // 8. 응답 구성 (모바일 앱 호환)
    // 케이스 A: 기존 ACTIVE 회원 - 로그인 처리
    if (existingUser && existingUser.status === 'ACTIVE' && purpose === 'SIGNUP') {
      const tokens = await generateTokens(existingUser.id, supabase);
      return successResponse({
        message: '로그인 되었습니다.',
        verificationToken,
        isRegistered: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        status: existingUser.status,
      });
    }

    // 케이스 B: 선등록 회원 (PENDING + pre_registered)
    if (existingUser && existingUser.status === 'PENDING' && existingUser.pre_registered) {
      const preRegisteredData: PreRegisteredData = {
        name: existingUser.name,
        birthDate: formatBirthDateToCompact(existingUser.birth_date),
        gender: existingUser.gender || 'M',
        nationality: existingUser.nationality || 'KR',
        teamId: String(existingUser.partner_id),  // ID를 string으로 변환
        teamName: existingUser.partners?.name || undefined,
        jobTitle: existingUser.job_title || '',
        preRegistered: true,
      };

      return successResponse({
        message: '인증이 완료되었습니다.',
        verificationToken,
        isRegistered: false,
        preRegisteredData,
      });
    }

    // 케이스 C: 이직 시나리오 (INACTIVE 상태)
    if (existingUser && existingUser.status === 'INACTIVE') {
      return successResponse({
        message: '인증이 완료되었습니다.',
        verificationToken,
        isRegistered: false,
        existingUser: {
          id: existingUser.id,
          status: 'INACTIVE',
          companyName: existingUser.companies?.name || '이전 회사',
        },
      });
    }

    // 케이스 D: 신규 회원
    return successResponse({
      message: '인증이 완료되었습니다.',
      verificationToken,
      isRegistered: false,
      preRegisteredData: null,
    });
  } catch (error) {
    return serverError(error);
  }
});
