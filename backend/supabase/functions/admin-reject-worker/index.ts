// 관리자 근로자 반려 Edge Function
// REQUESTED 상태의 근로자를 REJECTED로 전환
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RejectWorkerRequest {
  workerId: string;
  reason?: string; // 반려 사유 (선택)
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // MY_SERVICE_ROLE_KEY를 우선 사용, 없으면 기본 SUPABASE_SERVICE_ROLE_KEY 사용
    const serviceRoleKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    console.log('[admin-reject-worker] SUPABASE_URL:', supabaseUrl);
    console.log('[admin-reject-worker] SERVICE_ROLE_KEY exists:', !!serviceRoleKey, 'length:', serviceRoleKey.length);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-supabase-role': 'service_role',
        },
      },
    });

    // 1. JWT 토큰에서 관리자 정보 추출
    const authHeader = req.headers.get('Authorization');
    console.log('[admin-reject-worker] authHeader:', authHeader?.substring(0, 50));

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[admin-reject-worker] token length:', token.length);

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    console.log('[admin-reject-worker] authUser:', authUser?.id, 'authError:', authError?.message);

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증입니다.', details: authError?.message }),
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
        JSON.stringify({ error: '권한이 없습니다. 관리자만 근로자를 반려할 수 있습니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 요청 데이터 파싱
    const data: RejectWorkerRequest = await req.json();

    if (!data.workerId) {
      return new Response(
        JSON.stringify({ error: 'workerId는 필수 항목입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 근로자 정보 조회
    const { data: worker, error: workerError } = await supabase
      .from('users')
      .select('id, name, phone, status, company_id, site_id, partner_id')
      .eq('id', data.workerId)
      .single();

    if (workerError || !worker) {
      return new Response(
        JSON.stringify({ error: '근로자 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 상태 확인 (REQUESTED만 반려 가능)
    if (worker.status !== 'REQUESTED') {
      return new Response(
        JSON.stringify({
          error: `반려할 수 없는 상태입니다. (현재 상태: ${worker.status})`,
          currentStatus: worker.status,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. 권한별 접근 제어 검증
    if (adminUser.role === 'SITE_ADMIN') {
      // SITE_ADMIN: 자기 현장만
      if (worker.company_id !== adminUser.company_id || worker.site_id !== adminUser.site_id) {
        return new Response(
          JSON.stringify({ error: '해당 현장의 근로자만 반려할 수 있습니다.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (adminUser.role === 'TEAM_ADMIN') {
      // TEAM_ADMIN: 자기 팀만
      if (
        worker.company_id !== adminUser.company_id ||
        worker.site_id !== adminUser.site_id ||
        worker.partner_id !== adminUser.partner_id
      ) {
        return new Response(
          JSON.stringify({ error: '해당 팀의 근로자만 반려할 수 있습니다.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 8. 반려 처리 (users 테이블에서 삭제 - 재가입 가능하도록)
    console.log('[admin-reject-worker] Deleting worker for rejection:', data.workerId);

    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', data.workerId);

    console.log('[admin-reject-worker] Delete result:', { deleteError });

    if (deleteError) {
      console.error('Worker rejection error:', deleteError);
      return new Response(
        JSON.stringify({ error: '반려 처리 중 오류가 발생했습니다.', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supabase Auth에서도 사용자 삭제
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(data.workerId);
    if (authDeleteError) {
      console.warn('[admin-reject-worker] Auth user deletion failed (may not exist):', authDeleteError.message);
      // Auth 삭제 실패는 무시 (users 테이블 삭제가 메인)
    }

    // 9. 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: `${worker.name}님의 가입 요청을 반려하고 삭제했습니다.`,
        data: {
          id: worker.id,
          name: worker.name,
          phone: worker.phone,
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
