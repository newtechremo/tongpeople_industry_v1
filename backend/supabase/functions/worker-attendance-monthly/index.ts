// 근로자 월별 출퇴근 기록 조회 Edge Function
// 근로자 본인의 특정 월 출퇴근 이력 및 통계 반환
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 근무 시간 계산 (시간 단위)
function calculateWorkHours(checkInTime: string, checkOutTime: string | null): number | null {
  if (!checkOutTime) return null;

  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.round(diffHours * 10) / 10; // 소수점 1자리
}

// 요일 계산
function getDayOfWeek(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Authorization 헤더에서 JWT 토큰 추출
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

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
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증 토큰입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 쿼리 파라미터 파싱
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // 유효성 검증
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return new Response(
        JSON.stringify({ error: '올바른 연도와 월을 입력해주세요. (year, month)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 해당 월의 시작일과 종료일 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 다음 달 0일 = 이번 달 마지막 날

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // 4. 출퇴근 기록 조회
    const { data: attendanceRecords, error: recordsError } = await supabaseAdmin
      .from('attendance')
      .select('id, work_date, check_in_time, check_out_time, is_auto_out, has_accident')
      .eq('user_id', user.id)
      .gte('work_date', startDateStr)
      .lte('work_date', endDateStr)
      .order('work_date', { ascending: false });

    if (recordsError) {
      console.error('Attendance records error:', recordsError);
      return new Response(
        JSON.stringify({ error: '출퇴근 기록 조회 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 통계 계산
    const totalDays = attendanceRecords?.length || 0;
    let totalHours = 0;

    const records = attendanceRecords?.map(record => {
      const workHours = calculateWorkHours(record.check_in_time, record.check_out_time);
      if (workHours !== null) {
        totalHours += workHours;
      }

      // 오늘 날짜 확인
      const today = new Date().toISOString().split('T')[0];
      const isToday = record.work_date === today;

      // 상태 결정
      let status = '출근 전';
      if (record.check_in_time && !record.check_out_time) {
        status = '근무중';
      } else if (record.check_out_time) {
        status = '완료';
      }

      return {
        workDate: record.work_date,
        dayOfWeek: getDayOfWeek(record.work_date),
        checkInTime: record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
        checkOutTime: record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
        workHours: workHours,
        status: status,
        isAutoOut: record.is_auto_out || false,
        hasAccident: record.has_accident || false,
        isToday: isToday,
      };
    }) || [];

    // 6. 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          summary: {
            totalDays: totalDays,
            totalHours: Math.round(totalHours * 10) / 10, // 소수점 1자리
            year: year,
            month: month,
          },
          records: records,
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
