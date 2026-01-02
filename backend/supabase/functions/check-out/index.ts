// 퇴근 처리 Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckOutRequest {
  site_id: number;
  user_id?: string;  // 관리자가 직접 퇴근 처리 시
  qr_payload?: {     // QR 스캔으로 퇴근 처리 시
    workerId: string;
    timestamp: number;
    expiresAt: number;
  };
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

    const { site_id, user_id, qr_payload }: CheckOutRequest = await req.json();

    // 사용자 ID 결정
    let targetUserId = user_id;
    if (qr_payload) {
      // QR 유효성 검사
      const now = Date.now();
      if (qr_payload.expiresAt < now) {
        return new Response(
          JSON.stringify({ error: 'QR 코드가 만료되었습니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUserId = qr_payload.workerId;
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: '사용자 정보가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 현장 정보 조회
    const { data: site } = await supabase
      .from('sites')
      .select('work_day_start_hour')
      .eq('id', site_id)
      .single();

    // 근무일 계산
    const checkOutTime = new Date();
    const hour = checkOutTime.getHours();
    let workDate = new Date(checkOutTime);
    const startHour = site?.work_day_start_hour ?? 4;

    if (hour < startHour) {
      workDate.setDate(workDate.getDate() - 1);
    }
    const workDateStr = workDate.toISOString().split('T')[0];

    // 출근 기록 조회
    const { data: attendance, error: fetchError } = await supabase
      .from('attendance')
      .select('*, users(name)')
      .eq('work_date', workDateStr)
      .eq('site_id', site_id)
      .eq('user_id', targetUserId)
      .single();

    if (fetchError || !attendance) {
      return new Response(
        JSON.stringify({ error: '오늘 출근 기록이 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (attendance.check_out_time && !attendance.is_auto_out) {
      return new Response(
        JSON.stringify({ error: '이미 퇴근 처리되었습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 퇴근 시간 업데이트
    const { error: updateError } = await supabase
      .from('attendance')
      .update({
        check_out_time: checkOutTime.toISOString(),
        is_auto_out: false,  // 수동 퇴근으로 변경
      })
      .eq('id', attendance.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: '퇴근 처리 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 근무 시간 계산
    const checkIn = new Date(attendance.check_in_time);
    const workHours = (checkOutTime.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${attendance.worker_name}님 퇴근 처리되었습니다.`,
        data: {
          worker_name: attendance.worker_name,
          check_in_time: attendance.check_in_time,
          check_out_time: checkOutTime.toISOString(),
          work_hours: Math.round(workHours * 10) / 10,
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
