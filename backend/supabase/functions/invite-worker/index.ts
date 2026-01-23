// 근로자 초대(선등록) Edge Function
// 관리자가 근로자를 선등록하고 SMS로 초대 링크 발송
// 근로자 상태: PENDING (동의대기)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.208.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteWorkerRequest {
  teamId: number;           // 팀 ID (partner_id)
  name: string;             // 이름
  phone: string;            // 휴대폰 (010-1234-5678 형식도 허용)
  birthDate: string;        // 생년월일 (YYYY-MM-DD)
  position: string;         // 직책/직종 (job_title)
  role: 'WORKER' | 'TEAM_ADMIN';  // 시스템 권한
  nationality?: string;     // 국적 (선택)
  gender?: 'M' | 'F';       // 성별 (선택)
}

// 전화번호 정규화 (하이픈 제거)
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// 생년월일 포맷 검증 (YYYY-MM-DD)
function isValidBirthDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

// 네이버 클라우드 SENS API 시그니처 생성
async function makeSignature(
  method: string,
  uri: string,
  timestamp: string,
  accessKey: string,
  secretKey: string
): Promise<string> {
  const message = `${method} ${uri}\n${timestamp}\n${accessKey}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return base64Encode(new Uint8Array(signature));
}

// 네이버 클라우드 SENS SMS 발송 (LMS 지원)
async function sendInviteSms(
  phone: string,
  message: string,
  serviceId: string,
  accessKey: string,
  secretKey: string,
  sendNumber: string
): Promise<{ success: boolean; error?: string }> {
  const timestamp = Date.now().toString();
  const uri = `/sms/v2/services/${serviceId}/messages`;
  const url = `https://sens.apigw.ntruss.com${uri}`;

  const signature = await makeSignature('POST', uri, timestamp, accessKey, secretKey);

  // 메시지 길이에 따라 SMS/LMS 자동 선택 (90바이트 초과시 LMS)
  const msgType = new TextEncoder().encode(message).length > 90 ? 'LMS' : 'SMS';

  const body = {
    type: msgType,
    from: sendNumber,
    content: message,
    messages: [{ to: phone }],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': accessKey,
        'x-ncp-apigw-signature-v2': signature,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (response.ok && result.statusCode === '202') {
      console.log('[SENS] 초대 SMS 발송 성공:', result.requestId);
      return { success: true };
    } else {
      console.error('[SENS] 초대 SMS 발송 실패:', result);
      return { success: false, error: result.statusMessage || 'SMS 발송 실패' };
    }
  } catch (error) {
    console.error('[SENS] API 호출 오류:', error);
    return { success: false, error: '네트워크 오류' };
  }
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

    // 3. 관리자 권한 확인 (SUPER_ADMIN, SITE_ADMIN, TEAM_ADMIN만 허용)
    const allowedRoles = ['SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN'];
    if (!allowedRoles.includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ error: '권한이 없습니다. 관리자만 근로자를 초대할 수 있습니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 요청 데이터 파싱
    const data: InviteWorkerRequest = await req.json();

    // 5. 필수 필드 검증
    if (!data.teamId || !data.name || !data.phone || !data.birthDate || !data.position || !data.role) {
      return new Response(
        JSON.stringify({ error: 'teamId, name, phone, birthDate, position, role은 필수 항목입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. role 값 검증
    if (!['WORKER', 'TEAM_ADMIN'].includes(data.role)) {
      return new Response(
        JSON.stringify({ error: 'role은 WORKER 또는 TEAM_ADMIN이어야 합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. 생년월일 형식 검증
    if (!isValidBirthDate(data.birthDate)) {
      return new Response(
        JSON.stringify({ error: '생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. 휴대폰 번호 정규화
    const normalizedPhone = normalizePhone(data.phone);

    // 9. 팀 정보 조회 (company_id, site_id, partner_id 가져오기)
    const { data: team, error: teamError } = await supabase
      .from('partners')
      .select('id, name, company_id, site_id')
      .eq('id', data.teamId)
      .single();

    if (teamError || !team) {
      return new Response(
        JSON.stringify({ error: '팀 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. 권한별 접근 제어
    // SITE_ADMIN: 같은 현장의 팀만 초대 가능
    if (adminUser.role === 'SITE_ADMIN') {
      if (team.company_id !== adminUser.company_id || team.site_id !== adminUser.site_id) {
        return new Response(
          JSON.stringify({ error: '해당 현장의 팀만 초대할 수 있습니다.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // TEAM_ADMIN: 자기 팀만 초대 가능
    else if (adminUser.role === 'TEAM_ADMIN') {
      if (
        team.company_id !== adminUser.company_id ||
        team.site_id !== adminUser.site_id ||
        team.id !== adminUser.partner_id
      ) {
        return new Response(
          JSON.stringify({ error: '자신의 팀만 초대할 수 있습니다.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 11. 중복 확인 (같은 전화번호로 ACTIVE 또는 PENDING 상태 근로자 존재 시 에러)
    const { data: existingUser, error: existError } = await supabase
      .from('users')
      .select('id, status, name, company_id, companies(name)')
      .eq('phone', normalizedPhone)
      .in('status', ['ACTIVE', 'PENDING', 'REQUESTED'])
      .single();

    if (existingUser && !existError) {
      const companyName = existingUser.companies?.name || '해당 회사';
      return new Response(
        JSON.stringify({
          error: `이미 등록된 전화번호입니다.`,
          detail: `${existingUser.name}님이 ${companyName}에서 ${existingUser.status} 상태로 등록되어 있습니다.`
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // INACTIVE 상태는 허용 (이직 시나리오)

    // 12. Supabase Auth 사용자 생성
    const fakeEmail = `${normalizedPhone}@phone.tongpass.local`;
    const randomPassword = crypto.randomUUID();

    const { data: authNewUser, error: authCreateError } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        phone: normalizedPhone,
        pre_registered: true,
      },
    });

    if (authCreateError || !authNewUser.user) {
      console.error('Auth error:', authCreateError);
      return new Response(
        JSON.stringify({ error: '계정 생성 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 13. users 테이블에 삽입 (PENDING 상태)
    const now = new Date().toISOString();
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: authNewUser.user.id,
        company_id: team.company_id,
        site_id: team.site_id,
        partner_id: team.id,
        name: data.name,
        phone: normalizedPhone,
        birth_date: data.birthDate,
        job_title: data.position,
        role: data.role,
        status: 'PENDING',  // 동의대기
        nationality: data.nationality || 'KR',
        gender: data.gender || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (userError) {
      console.error('User insert error:', userError);
      // 롤백: Auth 사용자 삭제
      await supabase.auth.admin.deleteUser(authNewUser.user.id);
      return new Response(
        JSON.stringify({ error: '사용자 정보 저장 중 오류가 발생했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 14. 초대 토큰 생성 (Unicode 지원 Base64)
    const tokenPayload = JSON.stringify({
      userId: newUser.id,
      phone: normalizedPhone,
      name: data.name,
      purpose: 'INVITATION',
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7일 유효
    });
    // Unicode를 지원하기 위해 encodeURIComponent 사용
    const inviteToken = btoa(encodeURIComponent(tokenPayload));

    // 15. 초대 링크 생성 (모바일 앱 딥링크)
    const inviteLink = `tongpass://invite?token=${inviteToken}`;

    // 16. SMS 발송 (네이버 클라우드 SENS API)
    const smsAccessKey = Deno.env.get('NCP_ACCESS_KEY');
    const smsSecretKey = Deno.env.get('NCP_SECRET_KEY');
    const smsServiceId = Deno.env.get('NCP_SMS_SERVICE_ID');
    const smsSendNumber = Deno.env.get('NCP_SMS_SEND_NUMBER');

    const smsMessage = `[통패스] ${data.name}님, ${team.name}에 초대되었습니다.\n아래 링크를 눌러 가입을 완료해주세요.\n${inviteLink}\n(7일간 유효)`;

    if (smsAccessKey && smsSecretKey && smsServiceId && smsSendNumber) {
      const smsResult = await sendInviteSms(
        normalizedPhone,
        smsMessage,
        smsServiceId,
        smsAccessKey,
        smsSecretKey,
        smsSendNumber
      );

      if (!smsResult.success) {
        console.error('[SMS] 초대 문자 발송 실패:', smsResult.error);
        // SMS 발송 실패해도 등록은 완료된 상태이므로 경고만 로그
      } else {
        console.log('[SMS] 초대 문자 발송 성공');
      }
    } else {
      // 환경변수 미설정: 콘솔에만 출력 (개발 모드)
      console.log('='.repeat(60));
      console.log('[개발모드] SMS 환경변수 미설정 - 콘솔 출력만');
      console.log(`근로자: ${data.name} (${normalizedPhone})`);
      console.log(`팀: ${team.name}`);
      console.log(`초대 링크: ${inviteLink}`);
      console.log('='.repeat(60));
    }

    // 17. 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: '근로자 초대가 완료되었습니다.',
        data: {
          userId: newUser.id,
          name: data.name,
          phone: normalizedPhone,
          team: team.name,
          role: data.role,
          status: 'PENDING',
          inviteToken,
          inviteLink,
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
