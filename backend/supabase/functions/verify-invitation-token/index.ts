// 초대 토큰 검증 Edge Function
// 모바일 앱에서 초대 링크 클릭 시 토큰 검증 및 선등록 데이터 반환
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationToken {
  userId: string;
  phone: string;
  name: string;
  purpose: 'INVITATION';
  createdAt: number;
  expiresAt: number;
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

    // 1. URL에서 token 파라미터 추출
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: '토큰이 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 토큰 디코딩
    let tokenData: InvitationToken;
    try {
      tokenData = JSON.parse(atob(token));
    } catch {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 토큰입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 토큰 목적 확인
    if (tokenData.purpose !== 'INVITATION') {
      return new Response(
        JSON.stringify({ error: '초대 토큰이 아닙니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 토큰 만료 확인
    if (tokenData.expiresAt < Date.now()) {
      return new Response(
        JSON.stringify({
          error: '초대 링크가 만료되었습니다.',
          detail: '관리자에게 새로운 초대 링크를 요청해주세요.'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. 근로자 정보 조회
    const { data: user, error: userError } = await supabase
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
        partner_id,
        partners(id, name)
      `)
      .eq('id', tokenData.userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: '초대 정보를 찾을 수 없습니다.',
          detail: '이미 처리된 초대이거나 삭제된 초대일 수 있습니다.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. 토큰의 전화번호와 실제 사용자 전화번호 일치 확인
    if (user.phone !== tokenData.phone) {
      return new Response(
        JSON.stringify({ error: '토큰 정보가 일치하지 않습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. 상태 확인 (PENDING 상태가 아니면 이미 처리됨)
    if (user.status !== 'PENDING') {
      // 이미 ACTIVE 상태면 가입 완료
      if (user.status === 'ACTIVE') {
        return new Response(
          JSON.stringify({
            valid: false,
            error: '이미 가입이 완료된 근로자입니다.',
            detail: '앱에서 로그인해주세요.',
            status: user.status,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 기타 상태 (INACTIVE, BLOCKED 등)
      return new Response(
        JSON.stringify({
          valid: false,
          error: '초대가 유효하지 않습니다.',
          detail: `현재 상태: ${user.status}`,
          status: user.status,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. 성공 응답: 선등록 데이터 반환
    return new Response(
      JSON.stringify({
        valid: true,
        message: '유효한 초대입니다.',
        preRegisteredData: {
          userId: user.id,
          name: user.name,
          phone: user.phone,
          birthDate: user.birth_date,
          gender: user.gender,
          nationality: user.nationality,
          jobTitle: user.job_title,
          role: user.role,
          teamId: user.partner_id,
          teamName: user.partners?.name,
          preRegistered: true,
          status: user.status,
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
