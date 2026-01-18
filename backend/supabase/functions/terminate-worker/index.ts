// 근로자 퇴사 처리 Edge Function
// 관리자가 근로자를 퇴사 처리 (status → INACTIVE)
// 트리거가 자동으로 user_employment_history에 이력 저장
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TerminateWorkerRequest {
  workerId: string;  // UUID
  leaveReason: 'RESIGNED' | 'TRANSFERRED' | 'FIRED';
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
        JSON.stringify({ error: '권한이 없습니다. 관리자만 퇴사 처리가 가능합니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 요청 데이터 파싱
    const data: TerminateWorkerRequest = await req.json();

    if (!data.workerId || !data.leaveReason) {
      return new Response(
        JSON.stringify({ error: 'workerId와 leaveReason이 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 대상 근로자 정보 조회
    const { data: worker, error: workerError } = await supabase
      .from('users')
      .select('id, name, phone, company_id, site_id, partner_id, role, status')
      .eq('id', data.workerId)
      .single();

    if (workerError || !worker) {
      return new Response(
        JSON.stringify({ error: '근로자를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 이미 퇴사 처리된 근로자인지 확인
    if (worker.status === 'INACTIVE') {
      return new Response(
        JSON.stringify({ error: '이미 퇴사 처리된 근로자입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. 권한별 접근 제어

    // 7-1. SUPER_ADMIN 퇴사 특수 처리
    if (worker.role === 'SUPER_ADMIN') {
      // 회사의 다른 SUPER_ADMIN 수 확인
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', worker.company_id)
        .eq('role', 'SUPER_ADMIN')
        .eq('status', 'ACTIVE')
        .neq('id', worker.id);

      if (countError) {
        console.error('SUPER_ADMIN 수 확인 오류:', countError);
        return new Response(
          JSON.stringify({ error: '퇴사 처리 중 오류가 발생했습니다.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 마지막 SUPER_ADMIN이면 퇴사 불가
      if ((count ?? 0) === 0) {
        return new Response(
          JSON.stringify({
            error: '회사의 마지막 최고 관리자는 퇴사할 수 없습니다.',
            hint: '먼저 다른 관리자를 최고 관리자로 승격시킨 후 퇴사 처리해주세요.',
            requiresAction: 'PROMOTE_ADMIN'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 7-2. SITE_ADMIN: 같은 회사 + 같은 현장
    // 7-3. TEAM_ADMIN: 같은 회사 + 같은 현장 + 같은 팀
    if (adminUser.role === 'SITE_ADMIN') {
      if (worker.company_id !== adminUser.company_id || worker.site_id !== adminUser.site_id) {
        return new Response(
          JSON.stringify({ error: '해당 현장의 근로자만 관리할 수 있습니다.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (adminUser.role === 'TEAM_ADMIN') {
      if (
        worker.company_id !== adminUser.company_id ||
        worker.site_id !== adminUser.site_id ||
        worker.partner_id !== adminUser.partner_id
      ) {
        return new Response(
          JSON.stringify({ error: '자신의 팀 근로자만 관리할 수 있습니다.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 8. 근로자 퇴사 처리 (status → INACTIVE)
    // 트리거가 자동으로 user_employment_history에 이력 저장
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: 'INACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.workerId);

    if (updateError) {
      console.error('퇴사 처리 오류:', updateError);
      return new Response(
        JSON.stringify({ error: '퇴사 처리 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. 이력 테이블에 leave_reason과 created_by 업데이트
    // 트리거가 기본값 'RESIGNED'로 저장하므로, 실제 사유로 수정
    // 방금 생성된 이력 (5초 이내)만 업데이트
    const { error: historyError } = await supabase
      .from('user_employment_history')
      .update({
        leave_reason: data.leaveReason,
        created_by: adminUser.id,
      })
      .eq('user_id', data.workerId)
      .gte('created_at', new Date(Date.now() - 5000).toISOString()); // 5초 이내 생성된 레코드

    if (historyError) {
      console.error('이력 업데이트 오류:', historyError);
      // 이력 업데이트 실패해도 퇴사 처리는 완료되었으므로 계속 진행
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '퇴사 처리가 완료되었습니다.',
        data: {
          workerId: worker.id,
          name: worker.name,
          phone: worker.phone,
          leaveReason: data.leaveReason,
          leftAt: new Date().toISOString(),
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
