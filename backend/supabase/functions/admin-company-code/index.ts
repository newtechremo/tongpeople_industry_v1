// 관리자 회사코드 조회 Edge Function
// 현재 회사의 활성 코드를 조회하고 QR 정보를 반환
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 1. JWT 토큰에서 관리자 정보 추출
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 관리자 정보 조회
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, role, company_id, site_id')
      .eq('id', authUser.id)
      .single();

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: '사용자 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 관리자 권한 확인
    const allowedRoles = ['SUPER_ADMIN', 'SITE_ADMIN'];
    if (!allowedRoles.includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ error: '권한이 없습니다. 관리자만 회사코드를 조회할 수 있습니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminUser.company_id) {
      return new Response(
        JSON.stringify({ error: '회사 정보가 없습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 회사 정보 조회
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, address')
      .eq('id', adminUser.company_id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: '회사 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 활성화된 회사코드 조회
    const { data: companyCode, error: codeError } = await supabase
      .from('company_codes')
      .select('id, code, is_active, created_at, deactivated_at')
      .eq('company_id', adminUser.company_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError) {
      console.error('Company code query error:', codeError);
      return new Response(
        JSON.stringify({ error: '회사코드 조회 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 활성 코드가 없는 경우
    if (!companyCode) {
      return new Response(
        JSON.stringify({
          success: true,
          hasCode: false,
          message: '활성화된 회사코드가 없습니다. 새로운 코드를 생성해주세요.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. QR 코드 URL 생성 (옵션)
    // QR 코드는 프론트엔드에서 생성하거나, 별도 QR 생성 서비스 사용 가능
    // 여기서는 코드만 반환하고, 프론트에서 react-qr-code 등으로 생성
    const qrData = companyCode.code;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${qrData}`;

    // 8. 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        hasCode: true,
        data: {
          id: companyCode.id,
          code: companyCode.code,
          companyId: company.id,
          companyName: company.name,
          isActive: companyCode.is_active,
          createdAt: companyCode.created_at,
          qrImageUrl: qrImageUrl,
          qrData: qrData,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
