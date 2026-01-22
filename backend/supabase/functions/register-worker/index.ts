// 근로자 가입 Edge Function
// 회사코드/QR 방식(방식 B): 근로자가 직접 가입 → REQUESTED 상태 → 관리자 승인 대기
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterWorkerRequest {
  // SMS 인증
  verificationToken: string;
  phone: string;

  // 근로자 정보
  name: string;
  birthDate: string; // YYYYMMDD
  gender: 'M' | 'F';
  nationality: 'KR' | 'OTHER';
  jobTitle: string;

  // 소속
  companyId: number;
  siteId: number;
  partnerId: number;

  // 약관 동의
  termsAgreed: boolean;
  privacyAgreed: boolean;
  thirdPartyAgreed: boolean;
  locationAgreed: boolean;

  // 전자서명
  signatureImage: string; // Base64 이미지
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const data: RegisterWorkerRequest = await req.json();
    const normalizedPhone = normalizePhone(data.phone);

    // 1. 인증 토큰 검증
    const isDevToken = data.verificationToken.startsWith('DEV_TOKEN_');

    if (!isDevToken) {
      try {
        const tokenData = JSON.parse(atob(data.verificationToken));

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

        // PURPOSE는 SIGNUP 또는 LOGIN 모두 허용 (기존 회원 로그인 플로우 고려)
        if (!['SIGNUP', 'LOGIN'].includes(tokenData.purpose)) {
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
    } else {
      console.log('[DEV] 개발용 토큰으로 인증 우회:', normalizedPhone);
    }

    // 2. 필수 필드 검증
    if (!data.termsAgreed || !data.privacyAgreed || !data.thirdPartyAgreed || !data.locationAgreed) {
      return new Response(
        JSON.stringify({ error: '모든 필수 약관에 동의해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.name || !data.birthDate || !data.gender || !data.nationality || !data.jobTitle) {
      return new Response(
        JSON.stringify({ error: '모든 필수 정보를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.companyId || !data.siteId || !data.partnerId) {
      return new Response(
        JSON.stringify({ error: '회사, 현장, 팀 정보가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
          return new Response(
            JSON.stringify({ error: '생년월일 형식이 올바르지 않습니다. (YYYYMMDD)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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
          return new Response(
            JSON.stringify({ error: '사용자 정보 업데이트 중 오류가 발생했습니다.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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
          return new Response(
            JSON.stringify({ error: '계정 생성 중 오류가 발생했습니다.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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

        return new Response(
          JSON.stringify({
            success: true,
            message: '가입이 완료되었습니다.',
            data: {
              userId: authUser?.user?.id || existingUser.id,
              name: data.name,
              status: 'ACTIVE',
              isPreRegistered: true,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
              partner_id: data.partnerId,
              role: 'WORKER',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id);

          console.log('[INFO] 같은 회사 복귀:', normalizedPhone);

          return new Response(
            JSON.stringify({
              success: true,
              message: '계정이 재활성화되었습니다.',
              data: {
                userId: existingUser.id,
                status: 'ACTIVE',
                isReactivated: true
              }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 다른 회사로 이직
        else {
          await supabase
            .from('users')
            .update({
              company_id: data.companyId,
              site_id: data.siteId,
              partner_id: data.partnerId,
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

          return new Response(
            JSON.stringify({
              success: true,
              message: '새 회사로 가입 신청되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.',
              data: {
                userId: existingUser.id,
                status: 'REQUESTED',
                isTransferred: true,
                previousCompany: existingUser.companies?.name || '이전 회사'
              }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // 그 외 상태: 이미 가입됨
      else {
        return new Response(
          JSON.stringify({ error: '이미 가입된 휴대폰 번호입니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
      return new Response(
        JSON.stringify({ error: '현장 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('id', data.partnerId)
      .eq('site_id', data.siteId)
      .single();

    if (partnerError || !partner) {
      return new Response(
        JSON.stringify({ error: '팀 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: '계정 생성 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 생년월일 포맷 변환
    let formattedBirthDate: string;
    try {
      formattedBirthDate = formatBirthDate(data.birthDate);
    } catch {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: '생년월일 형식이 올바르지 않습니다. (YYYYMMDD)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. 사용자 프로필 생성 (users 테이블)
    const now = new Date().toISOString();
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        company_id: data.companyId,
        site_id: data.siteId,
        partner_id: data.partnerId,
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
      return new Response(
        JSON.stringify({ error: '사용자 정보 저장 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. 전자서명 저장 (추후 Storage 활용 가능, 현재는 생략)
    // TODO: Supabase Storage에 signatureImage 업로드 후 URL 저장

    return new Response(
      JSON.stringify({
        success: true,
        message: '가입 신청이 완료되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.',
        data: {
          userId: authUser.user.id,
          name: data.name,
          phone: normalizedPhone,
          status: 'REQUESTED',
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
