// 관리자 승인 대기 목록 조회 Edge Function
// REQUESTED 상태의 근로자 목록을 반환
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
      .select('id, role, company_id, site_id, partner_id')
      .eq('id', authUser.id)
      .single();

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: '사용자 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 관리자 권한 확인
    const allowedRoles = ['SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN'];
    if (!allowedRoles.includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ error: '권한이 없습니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 쿼리 파라미터 파싱
    const url = new URL(req.url);
    const siteIdParam = url.searchParams.get('siteId');

    // 5. 승인 대기 근로자 조회 쿼리 구성
    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        phone,
        birth_date,
        gender,
        nationality,
        job_title,
        role,
        status,
        requested_at,
        company_id,
        site_id,
        partner_id,
        partners:partner_id(id, name),
        sites:site_id(id, name),
        companies:company_id(id, name)
      `)
      .eq('status', 'REQUESTED')
      .order('requested_at', { ascending: false });

    // 6. 권한별 필터링
    if (adminUser.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN: 회사 내 모든 근로자
      query = query.eq('company_id', adminUser.company_id);

      // 현장 필터 (선택)
      if (siteIdParam) {
        query = query.eq('site_id', parseInt(siteIdParam));
      }
    } else if (adminUser.role === 'SITE_ADMIN') {
      // SITE_ADMIN: 자기 현장만
      query = query
        .eq('company_id', adminUser.company_id)
        .eq('site_id', adminUser.site_id);
    } else if (adminUser.role === 'TEAM_ADMIN') {
      // TEAM_ADMIN: 자기 팀만
      query = query
        .eq('company_id', adminUser.company_id)
        .eq('site_id', adminUser.site_id)
        .eq('partner_id', adminUser.partner_id);
    }

    const { data: workers, error: workersError } = await query;

    if (workersError) {
      console.error('Workers query error:', workersError);
      return new Response(
        JSON.stringify({ error: '근로자 목록 조회 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. 응답 데이터 가공
    const formattedWorkers = workers?.map(worker => {
      const partner = worker.partners as { id: number; name: string } | null;
      const site = worker.sites as { id: number; name: string } | null;
      const company = worker.companies as { id: number; name: string } | null;

      return {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        birthDate: worker.birth_date,
        gender: worker.gender,
        nationality: worker.nationality,
        jobTitle: worker.job_title,
        role: worker.role,
        status: worker.status,
        requestedAt: worker.requested_at,
        requestedTeamId: worker.partner_id,
        requestedTeamName: partner?.name || '미지정',
        siteId: worker.site_id,
        siteName: site?.name || '미지정',
        companyId: worker.company_id,
        companyName: company?.name || '미지정',
      };
    }) || [];

    // 8. 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        data: formattedWorkers,
        total: formattedWorkers.length,
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
