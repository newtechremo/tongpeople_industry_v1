// 근로자 출근 처리 Edge Function (근로자 본인이 직접 출근)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAccessToken } from '../_shared/jwt.ts';

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

    // Service Role 클라이언트 (DB 쿼리용)
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. 커스텀 JWT 검증
    const userId = await verifyAccessToken(token);

    if (!userId) {
      console.error('Token verification failed');
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
        birth_date,
        role,
        status,
        site_id,
        partner_id,
        sites (
          id,
          name,
          work_day_start_hour,
          checkout_policy,
          auto_hours,
          senior_age_threshold
        )
      `)
      .eq('id', userId)
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
      const message = statusMessages[workerData.status] || '출근 처리가 불가능한 상태입니다.';

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

    // 4. 근무일 계산 (현장 설정 기준)
    const checkInTime = new Date();
    const hour = checkInTime.getHours();
    const startHour = site.work_day_start_hour || 4;

    let workDate = new Date(checkInTime);
    if (hour < startHour) {
      workDate.setDate(workDate.getDate() - 1);
    }
    const workDateStr = workDate.toISOString().split('T')[0];

    // 5. 중복 출근 체크
    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('id, check_out_time')
      .eq('work_date', workDateStr)
      .eq('site_id', workerData.site_id)
      .eq('user_id', userId)
      .single();

    if (existing && !existing.check_out_time) {
      return new Response(
        JSON.stringify({ error: '이미 출근 처리되었습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existing && existing.check_out_time) {
      return new Response(
        JSON.stringify({ error: '오늘은 이미 퇴근하셨습니다. 내일 다시 출근해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 나이 및 고령자 여부 계산
    let age = null;
    let isSenior = false;
    if (workerData.birth_date) {
      const birth = new Date(workerData.birth_date);
      age = workDate.getFullYear() - birth.getFullYear();
      const m = workDate.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && workDate.getDate() < birth.getDate())) {
        age--;
      }
      isSenior = age >= (site.senior_age_threshold || 65);
    }

    // 7. 출근 기록 생성
    // check_out_time은 출근 시 null. AUTO_8H인 경우 Cron이 자동 퇴근 처리.
    const { data: attendance, error: insertError } = await supabaseAdmin
      .from('attendance')
      .insert({
        work_date: workDateStr,
        site_id: workerData.site_id,
        partner_id: workerData.partner_id,
        user_id: userId,
        worker_name: workerData.name,
        role: workerData.role,
        birth_date: workerData.birth_date,
        age: age,
        is_senior: isSenior,
        check_in_time: checkInTime.toISOString(),
        check_out_time: null,
        is_auto_out: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: '출근 처리 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkInTime: checkInTime.toISOString(),
        commuteStatus: 'WORK_ON',
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
