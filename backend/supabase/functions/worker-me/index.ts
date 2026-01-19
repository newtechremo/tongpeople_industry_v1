// 근로자 내 정보 조회 Edge Function
// 로그인한 근로자의 정보 및 출퇴근 상태 반환
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

    // 사용자 인증을 위한 클라이언트 (Anon Key 사용)
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

    // 2. 사용자 정보 조회 (회사, 현장, 팀 정보 포함)
    const { data: workerData, error: workerError } = await supabaseAdmin
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
        company_id,
        site_id,
        partner_id,
        companies (
          id,
          name,
          address
        ),
        sites (
          id,
          name,
          address,
          checkout_policy,
          auto_hours
        ),
        partners (
          id,
          name
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
        REJECTED: '가입이 반려되었습니다.',
        BLOCKED: '접근이 차단되었습니다. 관리자에게 문의해주세요.',
        INACTIVE: '비활성 계정입니다. 관리자에게 문의해주세요.',
      };
      const message = statusMessages[workerData.status] || '서비스를 이용할 수 없는 상태입니다.';

      return new Response(
        JSON.stringify({
          error: message,
          status: workerData.status,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 오늘 출퇴근 기록 조회
    const { data: site } = workerData.sites as any;
    const startHour = site?.work_day_start_hour || 4;

    // 근무일 계산
    const now = new Date();
    const hour = now.getHours();
    let workDate = new Date(now);
    if (hour < startHour) {
      workDate.setDate(workDate.getDate() - 1);
    }
    const workDateStr = workDate.toISOString().split('T')[0];

    const { data: todayAttendance } = await supabaseAdmin
      .from('attendance')
      .select('id, check_in_time, check_out_time, is_auto_out')
      .eq('user_id', user.id)
      .eq('work_date', workDateStr)
      .single();

    // 5. 출퇴근 상태 계산
    let commuteStatus: 'WORK_OFF' | 'WORK_ON' | 'WORK_DONE' = 'WORK_OFF';
    if (todayAttendance) {
      if (todayAttendance.check_out_time) {
        commuteStatus = 'WORK_DONE';
      } else {
        commuteStatus = 'WORK_ON';
      }
    }

    // 6. 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: {
            id: workerData.id,
            name: workerData.name,
            phone: workerData.phone,
            birthDate: workerData.birth_date,
            gender: workerData.gender,
            nationality: workerData.nationality,
            jobTitle: workerData.job_title,
            role: workerData.role,
            status: workerData.status,
          },
          company: workerData.companies,
          site: workerData.sites,
          partner: workerData.partners,
          todayAttendance: todayAttendance
            ? {
                checkInTime: todayAttendance.check_in_time,
                checkOutTime: todayAttendance.check_out_time,
                isAutoOut: todayAttendance.is_auto_out,
              }
            : null,
          commuteStatus,
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
