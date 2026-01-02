// 출근 처리 Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckInRequest {
  site_id: number;
  qr_payload: {
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

    const { site_id, qr_payload }: CheckInRequest = await req.json();

    // 1. QR 유효성 검사
    const now = Date.now();
    if (qr_payload.expiresAt < now) {
      return new Response(
        JSON.stringify({ error: 'QR 코드가 만료되었습니다. 새로고침 후 다시 시도해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, partners(name)')
      .eq('id', qr_payload.workerId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 현장 정보 조회
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', site_id)
      .single();

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ error: '현장을 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 근무일 계산 (현장 설정 기준)
    const checkInTime = new Date();
    const hour = checkInTime.getHours();
    let workDate = new Date(checkInTime);

    if (hour < site.work_day_start_hour) {
      workDate.setDate(workDate.getDate() - 1);
    }
    const workDateStr = workDate.toISOString().split('T')[0];

    // 5. 중복 출근 체크
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, check_out_time')
      .eq('work_date', workDateStr)
      .eq('site_id', site_id)
      .eq('user_id', qr_payload.workerId)
      .single();

    if (existing && !existing.check_out_time) {
      return new Response(
        JSON.stringify({ error: '이미 출근 처리되었습니다. 퇴근 후 다시 시도해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 나이 및 고령자 여부 계산
    let age = null;
    let isSenior = false;
    if (user.birth_date) {
      const birth = new Date(user.birth_date);
      age = workDate.getFullYear() - birth.getFullYear();
      const m = workDate.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && workDate.getDate() < birth.getDate())) {
        age--;
      }
      isSenior = age >= site.senior_age_threshold;
    }

    // 7. 자동 퇴근 시간 계산 (AUTO_8H 모드)
    let checkOutTime = null;
    let isAutoOut = false;
    if (site.checkout_policy === 'AUTO_8H') {
      checkOutTime = new Date(checkInTime.getTime() + site.auto_hours * 60 * 60 * 1000);
      isAutoOut = true;
    }

    // 8. 출근 기록 생성
    const { data: attendance, error: insertError } = await supabase
      .from('attendance')
      .insert({
        work_date: workDateStr,
        site_id: site_id,
        partner_id: user.partner_id,
        user_id: qr_payload.workerId,
        worker_name: user.name,
        role: user.role,
        birth_date: user.birth_date,
        age: age,
        is_senior: isSenior,
        check_in_time: checkInTime.toISOString(),
        check_out_time: checkOutTime?.toISOString() || null,
        is_auto_out: isAutoOut,
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
        message: `${user.name}님 출근 처리되었습니다.`,
        data: {
          worker_name: user.name,
          partner_name: user.partners?.name,
          check_in_time: checkInTime.toISOString(),
          check_out_time: checkOutTime?.toISOString(),
          is_auto_out: isAutoOut,
          is_senior: isSenior,
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
