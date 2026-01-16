// 사업자등록번호 중복 확인 Edge Function
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // RLS 우회
    );

    const { businessNumber } = await req.json();

    // 사업자번호 정규화
    const normalizedBizNum = businessNumber.replace(/[^0-9]/g, '');

    if (normalizedBizNum.length !== 10) {
      return new Response(
        JSON.stringify({ error: '올바른 사업자등록번호를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 중복 확인 (service_role_key로 RLS 우회)
    const { data, error } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('biz_num', normalizedBizNum)
      .maybeSingle();

    if (error) {
      console.error('Business number check error:', error);
      return new Response(
        JSON.stringify({ exists: false, error: '중복 확인 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ exists: !!data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ exists: false, error: '중복 확인 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
