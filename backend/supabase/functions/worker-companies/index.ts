// 참여 회사 목록 조회 Edge Function
// GET /worker-companies
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';
import { verifyAuthHeader } from '../_shared/jwt.ts';

interface CompanyWithSite {
  id: number;
  name: string;
  code: string;
  logo?: string;
  site: {
    id: number;
    name: string;
    address: string;
  };
  joinedAt?: string;
  role?: string;
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

    // 토큰 검증
    const userId = await verifyAuthHeader(req);
    if (!userId) {
      return errorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
    }

    // 1. 사용자 정보 및 현재 소속 조회
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        company_id,
        site_id,
        role,
        created_at,
        companies!inner(id, name, address),
        sites!inner(id, name, address)
      `)
      .eq('id', userId)
      .single();

    if (userError || !currentUser) {
      return errorResponse('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.', 404);
    }

    // 2. 회사 코드 조회
    const { data: companyCode } = await supabase
      .from('company_codes')
      .select('code')
      .eq('company_id', currentUser.company_id)
      .eq('is_active', true)
      .single();

    // 3. 이력 테이블이 있다면 과거 회사도 조회 (employment_history)
    const { data: historyRecords } = await supabase
      .from('employment_history')
      .select(`
        company_id,
        site_id,
        role,
        joined_at,
        left_at,
        companies!inner(id, name, address),
        sites!inner(id, name, address)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    // 4. 결과 구성
    const companies: CompanyWithSite[] = [];

    // 현재 회사 추가
    if (currentUser.companies && currentUser.sites) {
      companies.push({
        id: currentUser.companies.id,
        name: currentUser.companies.name,
        code: companyCode?.code || '',
        site: {
          id: currentUser.sites.id,
          name: currentUser.sites.name,
          address: currentUser.sites.address || '',
        },
        joinedAt: currentUser.created_at,
        role: currentUser.role,
      });
    }

    // 이력이 있으면 추가 (중복 제거)
    if (historyRecords) {
      for (const record of historyRecords) {
        // 현재 회사와 중복 체크
        const isDuplicate = companies.some(
          c => c.id === record.company_id && c.site.id === record.site_id
        );

        if (!isDuplicate && record.companies && record.sites) {
          // 이력 회사의 코드 조회
          const { data: historyCode } = await supabase
            .from('company_codes')
            .select('code')
            .eq('company_id', record.company_id)
            .eq('is_active', true)
            .single();

          companies.push({
            id: record.companies.id,
            name: record.companies.name,
            code: historyCode?.code || '',
            site: {
              id: record.sites.id,
              name: record.sites.name,
              address: record.sites.address || '',
            },
            joinedAt: record.joined_at,
            role: record.role,
          });
        }
      }
    }

    return successResponse({ data: companies });
  } catch (error) {
    return serverError(error);
  }
});
