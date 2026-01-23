// 관리자 로그인 Edge Function
// 휴대폰 번호 + 비밀번호 로그인
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginRequest {
  phone: string;
  password: string;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Service role client for DB queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Anon key from request header for auth
    const authHeader = req.headers.get('Authorization') ?? '';
    const anonKey = authHeader.replace('Bearer ', '');

    // Client for user authentication
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { phone, password }: LoginRequest = await req.json();
    const normalizedPhone = normalizePhone(phone);

    // 1. 전화번호로 사용자 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, role, status, is_active, company_id, site_id')
      .eq('phone', normalizedPhone)
      .single();

    if (userError) {
      console.error('User query error:', userError);
      return new Response(
        JSON.stringify({ error: '등록되지 않은 휴대폰 번호입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: '등록되지 않은 휴대폰 번호입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 계정 활성화 상태 확인 (status 또는 is_active 확인)
    const isActive = user.status === 'ACTIVE' || user.is_active === true;
    const isBlocked = user.status === 'BLOCKED';
    const isInactive = user.status === 'INACTIVE';

    if (isBlocked) {
      return new Response(
        JSON.stringify({ error: '차단된 계정입니다. 관리자에게 문의하세요.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isInactive || !isActive) {
      return new Response(
        JSON.stringify({ error: '비활성화된 계정입니다. 관리자에게 문의하세요.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 관리자 권한 확인 (관리자 웹 로그인)
    if (!['SUPER_ADMIN', 'SITE_ADMIN'].includes(user.role)) {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 없습니다. 근로자 앱을 이용해주세요.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Supabase Auth 로그인 (이메일 형식으로 변환)
    const fakeEmail = `${normalizedPhone}@phone.tongpass.local`;

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: fakeEmail,
      password: password,
    });

    if (authError) {
      console.error('Auth error:', authError.message);
      return new Response(
        JSON.stringify({ error: '비밀번호가 일치하지 않습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.session) {
      return new Response(
        JSON.stringify({ error: '로그인에 실패했습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 회사 및 현장 정보 조회
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', user.company_id)
      .single();

    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('id, name')
      .eq('id', user.site_id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: '로그인 성공',
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: normalizedPhone,
            role: user.role,
          },
          company: company,
          site: site,
          session: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_at: authData.session.expires_at,
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.', detail: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
