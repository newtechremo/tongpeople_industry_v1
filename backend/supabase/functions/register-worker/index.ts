// 근로자 가입 Edge Function
// 회사코드/QR 방식(방식 B): 근로자가 직접 가입 → REQUESTED 상태 → 관리자 승인 대기
// 모바일 앱 호환 응답 형식 지원
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateTokens } from '../_shared/jwt.ts';
import { handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';

interface RegisterWorkerRequest {
  // SMS 인증
  verificationToken?: string;
  phone: string;
  phoneNumber?: string; // 모바일 앱 호환

  // 근로자 정보
  name: string;
  birthDate: string; // YYYYMMDD
  gender: 'M' | 'F';
  nationality: 'KR' | 'OTHER' | string;
  jobTitle: string;
  email?: string;

  // 소속
  companyId?: number | string;
  siteId: number | string;
  partnerId?: number | string;
  teamId?: number | string; // 모바일 앱 호환 (partnerId와 동일)

  // 약관 동의 - 기존 형식 (개별 boolean)
  termsAgreed?: boolean;
  privacyAgreed?: boolean;
  thirdPartyAgreed?: boolean;
  locationAgreed?: boolean;

  // 약관 동의 - 모바일 앱 형식 (배열)
  agreedTerms?: string[];

  // 전자서명
  signatureImage?: string; // Base64 이미지
  signatureBase64?: string; // 모바일 앱 호환
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// 생년월일 형식 변환 (YYYYMMDD → YYYY-MM-DD)
function formatBirthDate(birthDate: string): string {
  if (birthDate.length !== 8) {
    throw new Error('Invalid birth date format');
  }
  return `${birthDate.substring(0, 4)}-${birthDate.substring(4, 6)}-${birthDate.substring(6, 8)}`;
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

    const data: RegisterWorkerRequest = await req.json();

    // 모바일 앱 호환: phoneNumber -> phone
    const phoneInput = data.phone || data.phoneNumber || '';
    const normalizedPhone = normalizePhone(phoneInput);

    // 모바일 앱 호환: teamId -> partnerId
    const partnerId = data.partnerId || data.teamId;

    // 모바일 앱 호환: signatureBase64 -> signatureImage
    const signatureImage = data.signatureImage || data.signatureBase64;

    // 모바일 앱 호환: agreedTerms 배열 처리
    const hasAgreedTerms = data.agreedTerms && data.agreedTerms.length >= 4;
    const termsAgreed = data.termsAgreed || (hasAgreedTerms && data.agreedTerms!.includes('terms'));
    const privacyAgreed = data.privacyAgreed || (hasAgreedTerms && data.agreedTerms!.includes('privacy'));
    const thirdPartyAgreed = data.thirdPartyAgreed || (hasAgreedTerms && data.agreedTerms!.includes('third_party'));
    const locationAgreed = data.locationAgreed || (hasAgreedTerms && data.agreedTerms!.includes('location'));

    // 1. 인증 토큰 검증
    const verificationToken = data.verificationToken || '';
    const isDevToken = verificationToken.startsWith('DEV_TOKEN_') || !verificationToken;

    if (!isDevToken && verificationToken) {
      try {
        const tokenData = JSON.parse(atob(verificationToken));

        if (tokenData.phone !== normalizedPhone) {
          return errorResponse('INVALID_TOKEN', '인증 정보가 일치하지 않습니다.');
        }

        if (tokenData.expiresAt < Date.now()) {
          return errorResponse('TOKEN_EXPIRED', '인증이 만료되었습니다. 처음부터 다시 진행해주세요.');
        }

        // PURPOSE는 SIGNUP 또는 LOGIN 모두 허용 (기존 회원 로그인 플로우 고려)
        if (!['SIGNUP', 'LOGIN'].includes(tokenData.purpose)) {
          return errorResponse('INVALID_TOKEN', '잘못된 인증 토큰입니다.');
        }
      } catch {
        return errorResponse('INVALID_TOKEN', '유효하지 않은 인증 토큰입니다.');
      }
    } else {
      console.log('[DEV] 개발용 토큰으로 인증 우회:', normalizedPhone);
    }

    // 2. 필수 필드 검증
    if (!termsAgreed || !privacyAgreed || !thirdPartyAgreed || !locationAgreed) {
      return errorResponse('UNKNOWN_ERROR', '모든 필수 약관에 동의해주세요.');
    }

    if (!data.name || !data.birthDate || !data.gender || !data.nationality || !data.jobTitle) {
      return errorResponse('UNKNOWN_ERROR', '모든 필수 정보를 입력해주세요.');
    }

    if (!data.siteId || !partnerId) {
      return errorResponse('INVALID_TEAM', '현장, 팀 정보가 필요합니다.');
    }

    // 서명 검증
    if (!signatureImage || signatureImage.length < 100) {
      return errorResponse('SIGNATURE_REQUIRED', '서명이 필요합니다.');
    }

    // 3. 중복 검사 (휴대폰 번호)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, status, company_id, site_id, partner_id, companies(name)')
      .eq('phone', normalizedPhone)
      .single();

    if (existingUser) {
      // REJECTED 상태: 재가입 허용 (기존 로직)
      if (existingUser.status === 'REJECTED') {
        await supabase.from('users').delete().eq('id', existingUser.id);
        console.log('[INFO] 반려된 사용자 재가입:', normalizedPhone);
      }

      // PENDING 상태: 관리자가 선등록한 경우 → 동의 완료로 즉시 ACTIVE (프리패스)
      else if (existingUser.status === 'PENDING') {
        // 생년월일 포맷 변환
        let formattedBirthDate: string;
        try {
          formattedBirthDate = formatBirthDate(data.birthDate);
        } catch {
          return errorResponse('UNKNOWN_ERROR', '생년월일 형식이 올바르지 않습니다. (YYYYMMDD)');
        }

        // 사용자 정보 업데이트 및 ACTIVE로 변경
        const { error: updateError } = await supabase
          .from('users')
          .update({
            status: 'ACTIVE',
            phone: normalizedPhone,
            birth_date: formattedBirthDate,
            gender: data.gender,
            nationality: data.nationality,
            job_title: data.jobTitle,
            terms_agreed_at: new Date().toISOString(),
            privacy_agreed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('PENDING user update error:', updateError);
          return errorResponse('SERVER_ERROR', '사용자 정보 업데이트 중 오류가 발생했습니다.', 500);
        }

        // Supabase Auth 계정 생성 (phone 기반 fake email)
        const fakeEmail = `${normalizedPhone}@phone.tongpass.local`;
        const randomPassword = crypto.randomUUID();

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: fakeEmail,
          password: randomPassword,
          email_confirm: true,
          user_metadata: {
            name: data.name,
            phone: normalizedPhone,
            user_id: existingUser.id,
          },
        });

        if (authError) {
          console.error('Auth creation error for PENDING user:', authError);
          // Auth 생성 실패해도 users 테이블은 업데이트됨 - 롤백
          await supabase
            .from('users')
            .update({ status: 'PENDING' })
            .eq('id', existingUser.id);
          return errorResponse('SERVER_ERROR', '계정 생성 중 오류가 발생했습니다.', 500);
        }

        // users 테이블에 auth_id가 필요하다면 연결 (현재 id가 auth_id와 동일하게 사용됨)
        // 선등록 시 id가 UUID가 아닌 경우를 대비
        if (authUser?.user) {
          await supabase
            .from('users')
            .update({ id: authUser.user.id })
            .eq('id', existingUser.id);
        }

        console.log('[INFO] 선등록 사용자 활성화 (프리패스):', normalizedPhone);

        // JWT 토큰 생성
        const userId = authUser?.user?.id || existingUser.id;
        const tokens = await generateTokens(userId, supabase);

        return successResponse({
          message: '가입이 완료되었습니다.',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          workerId: userId,
          status: 'ACTIVE',
          data: {
            userId,
            name: data.name,
            phone: normalizedPhone,
            status: 'ACTIVE',
            isPreRegistered: true,
          },
        });
      }

      // INACTIVE 상태: 이직 시나리오
      else if (existingUser.status === 'INACTIVE') {
        // 같은 회사 복귀
        if (existingUser.company_id === data.companyId) {
          await supabase
            .from('users')
            .update({
              status: 'ACTIVE',
              site_id: data.siteId,
              partner_id: partnerId,
              role: 'WORKER',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);

          console.log('[INFO] 같은 회사 복귀:', normalizedPhone);

          // JWT 토큰 생성
          const tokens = await generateTokens(existingUser.id, supabase);

          return successResponse({
            message: '계정이 재활성화되었습니다.',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            workerId: existingUser.id,
            status: 'ACTIVE',
            data: {
              userId: existingUser.id,
              name: data.name,
              phone: normalizedPhone,
              status: 'ACTIVE',
              isReactivated: true,
            }
          });
        }

        // 다른 회사로 이직
        else {
          await supabase
            .from('users')
            .update({
              company_id: data.companyId,
              site_id: data.siteId,
              partner_id: partnerId,
              role: 'WORKER',
              status: 'REQUESTED',  // 새 회사는 승인 필요
              requested_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);

          console.log('[INFO] 다른 회사로 이직:', {
            phone: normalizedPhone,
            from: existingUser.company_id,
            to: data.companyId
          });

          // JWT 토큰 생성 (REQUESTED 상태지만 토큰은 필요)
          const tokens = await generateTokens(existingUser.id, supabase);

          return successResponse({
            message: '새 회사로 가입 신청되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            workerId: existingUser.id,
            status: 'REQUESTED',
            data: {
              userId: existingUser.id,
              name: data.name,
              phone: normalizedPhone,
              status: 'REQUESTED',
              isTransferred: true,
              previousCompany: existingUser.companies?.name || '이전 회사'
            }
          });
        }
      }

      // 그 외 상태: 이미 가입됨
      else {
        return errorResponse('DUPLICATE_PHONE', '이미 가입된 휴대폰 번호입니다.');
      }
    }

    // 4. 회사/현장/팀 존재 여부 확인
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('company_id')
      .eq('id', data.siteId)
      .eq('company_id', data.companyId)
      .single();

    if (siteError || !site) {
      return errorResponse('NOT_FOUND', '현장 정보를 찾을 수 없습니다.', 404);
    }

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('id', partnerId)
      .eq('site_id', data.siteId)
      .single();

    if (partnerError || !partner) {
      return errorResponse('INVALID_TEAM', '팀 정보를 찾을 수 없습니다.', 404);
    }

    // 5. Supabase Auth 사용자 생성
    // 휴대폰 번호를 이메일 형식으로 변환 (Supabase Auth는 이메일 기반)
    // 비밀번호는 랜덤 생성 (근로자는 비밀번호 로그인 없음, SMS 로그인만)
    const fakeEmail = `${normalizedPhone}@phone.tongpass.local`;
    const randomPassword = crypto.randomUUID(); // 랜덤 비밀번호 (사용 안 함)

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        phone: normalizedPhone,
      },
    });

    if (authError || !authUser.user) {
      console.error('Auth error:', authError);
      return errorResponse('SERVER_ERROR', '계정 생성 중 오류가 발생했습니다.', 500);
    }

    // 6. 생년월일 포맷 변환
    let formattedBirthDate: string;
    try {
      formattedBirthDate = formatBirthDate(data.birthDate);
    } catch {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return errorResponse('UNKNOWN_ERROR', '생년월일 형식이 올바르지 않습니다. (YYYYMMDD)');
    }

    // 7. 사용자 프로필 생성 (users 테이블)
    const now = new Date().toISOString();
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        company_id: data.companyId,
        site_id: data.siteId,
        partner_id: partnerId,
        name: data.name,
        phone: normalizedPhone,
        birth_date: formattedBirthDate,
        gender: data.gender,
        nationality: data.nationality,
        job_title: data.jobTitle,
        role: 'WORKER',
        status: 'REQUESTED', // 승인 대기
        terms_agreed_at: now,
        privacy_agreed_at: now,
        requested_at: now,
      });

    if (userError) {
      console.error('User error:', userError);
      // 롤백: Auth 사용자 삭제
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return errorResponse('SERVER_ERROR', '사용자 정보 저장 중 오류가 발생했습니다.', 500);
    }

    // 8. 전자서명 저장 (추후 Storage 활용 가능, 현재는 생략)
    // TODO: Supabase Storage에 signatureImage 업로드 후 URL 저장

    // 9. JWT 토큰 생성
    const tokens = await generateTokens(authUser.user.id, supabase);

    return successResponse({
      message: '가입 신청이 완료되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      workerId: authUser.user.id,
      status: 'REQUESTED',
      data: {
        userId: authUser.user.id,
        name: data.name,
        phone: normalizedPhone,
        status: 'REQUESTED',
      },
    });
  } catch (error) {
    return serverError(error);
  }
});
