// 관리자 회원가입 Edge Function
// Step 1~4 데이터를 받아 회사 + 현장 + 사용자 생성
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignupRequest {
  // Step 1: 본인 인증
  verificationToken: string;  // verify-sms에서 받은 토큰
  name: string;
  phone: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed?: boolean;

  // Step 2: 회사 정보
  companyName: string;
  businessNumber: string;
  ceoName: string;
  companyAddress: string;
  employeeCountRange?: string;

  // Step 3: 첫 현장
  siteName: string;
  siteAddress?: string;
  checkoutPolicy?: 'AUTO_8H' | 'MANUAL';
  autoHours?: number;

  // Step 4: 비밀번호
  password: string;
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// 사업자등록번호 정규화
function normalizeBusinessNumber(bizNum: string): string {
  return bizNum.replace(/[^0-9]/g, '');
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

    const data: SignupRequest = await req.json();
    const normalizedPhone = normalizePhone(data.phone);

    // 1. 인증 토큰 검증
    // 개발용 토큰 우회 (DEV_TOKEN_으로 시작하는 토큰)
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

        if (tokenData.purpose !== 'SIGNUP') {
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
    if (!data.termsAgreed || !data.privacyAgreed) {
      return new Response(
        JSON.stringify({ error: '필수 약관에 동의해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 중복 검사 (휴대폰, 사업자등록번호)
    const normalizedBizNum = normalizeBusinessNumber(data.businessNumber);

    const { data: existingPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .single();

    if (existingPhone) {
      return new Response(
        JSON.stringify({ error: '이미 가입된 휴대폰 번호입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingBiz } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('biz_num', normalizedBizNum)
      .single();

    if (existingBiz) {
      return new Response(
        JSON.stringify({ error: '이미 등록된 사업자등록번호입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Supabase Auth 사용자 생성
    // 휴대폰 번호를 이메일 형식으로 변환 (Supabase Auth는 이메일 기반)
    const fakeEmail = `${normalizedPhone}@phone.tongpass.local`;

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      password: data.password,
      email_confirm: true, // 이메일 인증 스킵
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

    // 5. 회사 생성
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: data.companyName,
        business_number: normalizedBizNum,
        ceo_name: data.ceoName,
        address: data.companyAddress,
        employee_count_range: data.employeeCountRange,
        contact_phone: normalizedPhone,
      })
      .select()
      .single();

    if (companyError || !company) {
      console.error('Company error:', companyError);
      // 롤백: Auth 사용자 삭제
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: '회사 정보 저장 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 회사 프로필 생성 (사업자등록번호)
    const { error: profileError } = await supabase
      .from('client_profiles')
      .insert({
        company_id: company.id,
        biz_num: normalizedBizNum,
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // 계속 진행 (필수 아님)
    }

    // 7. 현장 생성
    const checkoutPolicy = data.checkoutPolicy || 'AUTO_8H';
    const autoHours = checkoutPolicy === 'AUTO_8H' ? (data.autoHours || 8) : null;

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .insert({
        company_id: company.id,
        name: data.siteName,
        address: data.siteAddress,
        checkout_policy: checkoutPolicy,
        auto_hours: autoHours,
      })
      .select()
      .single();

    if (siteError || !site) {
      console.error('Site error:', siteError);
      // 롤백
      await supabase.from('companies').delete().eq('id', company.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: '현장 정보 저장 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. 사용자 프로필 생성 (users 테이블)
    const now = new Date().toISOString();
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        company_id: company.id,
        site_id: site.id,
        name: data.name,
        phone: normalizedPhone,
        role: 'SUPER_ADMIN',
        is_active: true,
        terms_agreed_at: data.termsAgreed ? now : null,
        privacy_agreed_at: data.privacyAgreed ? now : null,
        marketing_agreed: data.marketingAgreed || false,
      });

    if (userError) {
      console.error('User error:', userError);
      // 롤백
      await supabase.from('sites').delete().eq('id', site.id);
      await supabase.from('companies').delete().eq('id', company.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: '사용자 정보 저장 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. 기본 팀 생성 (관리자, 일반근로자)
    await supabase.from('partners').insert([
      {
        company_id: company.id,
        site_id: site.id,
        name: '관리자',
        is_active: true,
      },
      {
        company_id: company.id,
        site_id: site.id,
        name: '일반근로자',
        is_active: true,
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: {
          userId: authUser.user.id,
          companyId: company.id,
          siteId: site.id,
          name: data.name,
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
