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

    // 8. 반려 처리 (REJECTED 상태로 전환)
    const now = new Date().toISOString();
    const { data: updatedWorker, error: updateError } = await supabase
      .from('users')
      .update({
        status: 'REJECTED',
        rejection_reason: data.reason || null,
        // rejected_at 필드는 없으므로 updated_at이 자동으로 갱신됨
      })
      .eq('id', data.workerId)
      .select()
      .single();

    if (updateError) {
      console.error('Worker rejection error:', updateError);
      return new Response(
        JSON.stringify({ error: '반려 처리 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: `${worker.name}님의 가입을 반려했습니다.`,
        data: {
          id: updatedWorker.id,
          name: updatedWorker.name,
          phone: updatedWorker.phone,
          status: updatedWorker.status,
          rejectionReason: updatedWorker.rejection_reason,
          rejectedAt: updatedWorker.updated_at,
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
