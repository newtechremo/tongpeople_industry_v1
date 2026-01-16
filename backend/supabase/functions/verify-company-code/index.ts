// 회사 코드 검증 Edge Function
// 근로자 앱 가입 시 회사코드 입력 → 회사/현장/팀 정보 반환
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyCompanyCodeRequest {
  companyCode: string;
}

interface Partner {
  id: number;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
}

interface Site {
  id: number;
  name: string;
  address: string | null;
  partners: Partner[];
}

interface Company {
  id: number;
  name: string;
  address: string | null;
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

    const { companyCode }: VerifyCompanyCodeRequest = await req.json();

    // 1. 회사 코드 유효성 검사
    if (!companyCode || typeof companyCode !== 'string') {
      return new Response(
        JSON.stringify({ error: '회사 코드를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedCode = companyCode.toUpperCase().trim();

    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      return new Response(
        JSON.stringify({ error: '올바른 회사 코드 형식이 아닙니다. (6자리 영문 대문자 + 숫자)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 회사 코드로 회사 조회
    const { data: companyCodeData, error: codeError } = await supabase
      .from('company_codes')
      .select('company_id, is_active')
      .eq('code', normalizedCode)
      .single();

    if (codeError || !companyCodeData) {
      return new Response(
        JSON.stringify({ error: '존재하지 않는 회사 코드입니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!companyCodeData.is_active) {
      return new Response(
        JSON.stringify({ error: '비활성화된 회사 코드입니다. 관리자에게 문의해주세요.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 회사 정보 조회
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, address')
      .eq('id', companyCodeData.company_id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: '회사 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 회사의 현장 목록 조회
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, address')
      .eq('company_id', company.id)
      .eq('is_active', true)
      .order('name');

    if (sitesError) {
      console.error('Sites error:', sitesError);
      return new Response(
        JSON.stringify({ error: '현장 정보 조회 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sites || sites.length === 0) {
      return new Response(
        JSON.stringify({ error: '활성화된 현장이 없습니다. 관리자에게 문의해주세요.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 각 현장의 팀(partners) 목록 조회
    const siteIds = sites.map(site => site.id);
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id, site_id, name, contact_name, contact_phone')
      .in('site_id', siteIds)
      .eq('is_active', true)
      .order('name');

    if (partnersError) {
      console.error('Partners error:', partnersError);
      return new Response(
        JSON.stringify({ error: '팀 정보 조회 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 현장별로 팀 그룹핑
    const sitesWithPartners: Site[] = sites.map(site => ({
      id: site.id,
      name: site.name,
      address: site.address,
      partners: partners
        ? partners
            .filter(p => p.site_id === site.id)
            .map(p => ({
              id: p.id,
              name: p.name,
              contact_name: p.contact_name,
              contact_phone: p.contact_phone,
            }))
        : [],
    }));

    // 7. 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        company: {
          id: company.id,
          name: company.name,
          address: company.address,
        },
        sites: sitesWithPartners,
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
