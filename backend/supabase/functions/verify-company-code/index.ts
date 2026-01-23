// 회사 코드 검증 Edge Function
// 근로자 앱 가입 시 회사코드 입력 → 회사/현장/팀 정보 반환
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';

interface VerifyCompanyCodeRequest {
  companyCode: string;
}

// 응답 인터페이스 (ID는 string, 필드명은 camelCase)
interface PartnerResponse {
  id: string;
  siteId: string;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
}

interface SiteResponse {
  id: string;
  name: string;
  address: string | null;
  partners: PartnerResponse[];
}

interface CompanyResponse {
  id: string;
  name: string;
  address: string | null;
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

    const { companyCode }: VerifyCompanyCodeRequest = await req.json();

    // 1. 회사 코드 유효성 검사
    if (!companyCode || typeof companyCode !== 'string') {
      return errorResponse('INVALID_COMPANY_CODE', '회사 코드를 입력해주세요.');
    }

    const normalizedCode = companyCode.toUpperCase().trim();

    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      return errorResponse('INVALID_COMPANY_CODE', '올바른 회사 코드 형식이 아닙니다. (6자리 영문 대문자 + 숫자)');
    }

    // 2. 회사 코드로 회사 조회
    const { data: companyCodeData, error: codeError } = await supabase
      .from('company_codes')
      .select('company_id, is_active')
      .eq('code', normalizedCode)
      .single();

    if (codeError || !companyCodeData) {
      return errorResponse('COMPANY_NOT_FOUND', '존재하지 않는 회사 코드입니다.', 404);
    }

    if (!companyCodeData.is_active) {
      return errorResponse('FORBIDDEN', '비활성화된 회사 코드입니다. 관리자에게 문의해주세요.', 403);
    }

    // 3. 회사 정보 조회
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, address')
      .eq('id', companyCodeData.company_id)
      .single();

    if (companyError || !company) {
      return errorResponse('COMPANY_NOT_FOUND', '회사 정보를 찾을 수 없습니다.', 404);
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
      return errorResponse('SERVER_ERROR', '현장 정보 조회 중 오류가 발생했습니다.', 500);
    }

    if (!sites || sites.length === 0) {
      return errorResponse('NOT_FOUND', '활성화된 현장이 없습니다. 관리자에게 문의해주세요.', 404);
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
      return errorResponse('SERVER_ERROR', '팀 정보 조회 중 오류가 발생했습니다.', 500);
    }

    // 6. 현장별로 팀 그룹핑 (ID를 string으로 변환)
    const sitesWithPartners = sites.map(site => ({
      id: String(site.id),
      name: site.name,
      address: site.address,
      partners: partners
        ? partners
            .filter(p => p.site_id === site.id)
            .map(p => ({
              id: String(p.id),
              siteId: String(p.site_id),
              name: p.name,
              contactName: p.contact_name,
              contactPhone: p.contact_phone,
            }))
        : [],
    }));

    // 7. 응답 반환
    return successResponse({
      company: {
        id: String(company.id),
        name: company.name,
        address: company.address,
      },
      sites: sitesWithPartners,
    });
  } catch (error) {
    return serverError(error);
  }
});
