// 자동 퇴근 처리 Edge Function
// 매일 22:10(KST)에 외부 크론이 호출하여 미퇴근자 전원 강제 퇴근
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 크론 시크릿 검증 (무단 호출 방지)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    if (expectedSecret && cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: '권한이 없습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 오늘 날짜 (KST 기준)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayStr = kstNow.toISOString().split('T')[0];

    // 미퇴근자 전원 강제 퇴근
    const { data, error, count } = await supabaseAdmin
      .from('attendance')
      .update({
        check_out_time: now.toISOString(),
        is_auto_out: true,
      })
      .is('check_out_time', null)
      .not('check_in_time', 'is', null)
      .eq('work_date', todayStr)
      .select('id');

    if (error) {
      console.error('Auto checkout error:', error);
      return new Response(
        JSON.stringify({ error: '자동 퇴근 처리 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updatedCount = data?.length || 0;
    console.log(`[Auto Checkout] ${todayStr}: ${updatedCount}명 자동 퇴근 처리`);

    return new Response(
      JSON.stringify({
        success: true,
        date: todayStr,
        updatedCount,
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
