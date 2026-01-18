// 근로자 퇴근 처리 Edge Function (근로자 본인이 직접 퇴근)
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
    // Authorization 헤더에서 JWT 토큰 추출
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // 사용자 인증을 위한 클라이언트
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Service Role 클라이언트 (DB 쿼리용)
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. JWT 검증 및 사용자 확인
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증 토큰입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 사용자 정보 조회
    const { data: workerData, error: workerError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        status,
        site_id,
        sites (
          id,
          work_day_start_hour
        )
      `)
      .eq('id', user.id)
      .single();

    if (workerError || !workerData) {
      console.error('Worker query error:', workerError);
      return new Response(
        JSON.stringify({ error: '사용자 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 사용자 상태 확인
    if (workerData.status !== 'ACTIVE') {
      const statusMessages: Record<string, string> = {
        PENDING: '동의가 필요합니다. 가입을 완료해주세요.',
        REQUESTED: '가입 승인 대기 중입니다.',
        BLOCKED: '접근이 차단되었습니다. 관리자에게 문의해주세요.',
        INACTIVE: '비활성 계정입니다. 관리자에게 문의해주세요.',
      };
      const message = statusMessages[workerData.status] || '퇴근 처리가 불가능한 상태입니다.';

      return new Response(
        JSON.stringify({ error: message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const site = workerData.sites as any;
    if (!site) {
      return new Response(
        JSON.stringify({ error: '소속 현장 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 근무일 계산
    const checkOutTime = new Date();
    const hour = checkOutTime.getHours();
    const startHour = site.work_day_start_hour || 4;

    let workDate = new Date(checkOutTime);
    if (hour < startHour) {
      workDate.setDate(workDate.getDate() - 1);
    }
    const workDateStr = workDate.toISOString().split('T')[0];

    // 5. 오늘 출근 기록 조회
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('id, check_in_time, check_out_time, is_auto_out')
      .eq('work_date', workDateStr)
      .eq('site_id', workerData.site_id)
      .eq('user_id', user.id)
      .single();

    if (attendanceError || !attendance) {
      return new Response(
        JSON.stringify({ error: '출근 기록을 찾을 수 없습니다. 먼저 출근해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (attendance.check_out_time) {
      return new Response(
        JSON.stringify({ error: '이미 퇴근 처리되었습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 근무 시간 계산 (분 단위)
    const checkInTime = new Date(attendance.check_in_time);
    const workDuration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));

    // 7. 퇴근 처리 (수동 퇴근으로 표시)
    const { error: updateError } = await supabaseAdmin
      .from('attendance')
      .update({
        check_out_time: checkOutTime.toISOString(),
        is_auto_out: false, // 수동 퇴근
      })
      .eq('id', attendance.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: '퇴근 처리 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkOutTime: checkOutTime.toISOString(),
        workDuration: workDuration,
        commuteStatus: 'WORK_DONE',
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
