// 현장 팀(협력업체) 목록 조회 Edge Function
// GET /sites/:siteId/teams
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';

interface Team {
  id: string;      // ID는 string으로 통일
  name: string;
  siteId: string;  // ID는 string으로 통일
  contactName?: string;
  contactPhone?: string;
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

    // URL에서 siteId 추출
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    // /sites/:siteId/teams 형식에서 siteId 추출
    // 또는 쿼리 파라미터에서 추출
    let siteId: string | null = null;

    // 경로에서 추출 시도: /sites/123/teams
    const sitesIndex = pathParts.findIndex(p => p === 'sites');
    if (sitesIndex !== -1 && pathParts[sitesIndex + 1]) {
      siteId = pathParts[sitesIndex + 1];
    }

    // 쿼리 파라미터에서 추출
    if (!siteId) {
      siteId = url.searchParams.get('siteId');
    }

    // POST 요청으로 받을 수도 있음
    if (!siteId && req.method === 'POST') {
      try {
        const body = await req.json();
        siteId = body.siteId?.toString();
      } catch {
        // JSON 파싱 실패 무시
      }
    }

    if (!siteId) {
      return errorResponse('INVALID_TEAM', '현장 ID가 필요합니다.', 400);
    }

    // 1. 현장 존재 여부 확인
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, company_id')
      .eq('id', siteId)
      .eq('is_active', true)
      .single();

    if (siteError || !site) {
      return errorResponse('INVALID_TEAM', '현장을 찾을 수 없습니다.', 404);
    }

    // 2. 해당 현장의 팀(partners) 목록 조회
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id, name, site_id, contact_name, contact_phone')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('name');

    if (partnersError) {
      console.error('Partners query error:', partnersError);
      return serverError(partnersError);
    }

    // 3. 응답 형식으로 변환 (ID를 string으로)
    const teams: Team[] = (partners || []).map(p => ({
      id: String(p.id),
      name: p.name,
      siteId: String(p.site_id),
      contactName: p.contact_name || undefined,
      contactPhone: p.contact_phone || undefined,
    }));

    return new Response(
      JSON.stringify(teams),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return serverError(error);
  }
});
