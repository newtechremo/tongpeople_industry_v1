// 근로자 내 정보 조회 Edge Function
// 로그인한 근로자의 정보 및 출퇴근 상태 반환
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { isSenior } from '../_shared/date.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';

Deno.serve(async (req) => {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authorization 헤더에서 JWT 토큰 추출
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
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
      return errorResponse('INVALID_TOKEN', '유효하지 않은 인증 토큰입니다.', 401);
    }

    // 2. 사용자 정보 조회 (회사, 현장, 팀 정보 포함)
    const { data: workerData, error: workerError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        phone,
        email,
        birth_date,
        gender,
        nationality,
        job_title,
        role,
        status,
        pre_registered,
        is_data_conflict,
        signature_url,
        company_id,
        site_id,
        partner_id,
        created_at,
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
      return errorResponse('NOT_FOUND', '사용자 정보를 찾을 수 없습니다.', 404);
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
      return errorResponse('FORBIDDEN', message, 403, { status: workerData.status });
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

    // 6. 고령자 여부 계산
    const birthDateStr = workerData.birth_date || '';
    const isSeniorWorker = birthDateStr ? isSenior(birthDateStr) : false;

    // 7. 응답 반환 (모든 필드 카멜케이스)
    return successResponse({
      data: {
        user: {
          id: workerData.id,
          phone: workerData.phone,
          phoneNumber: workerData.phone, // 프론트엔드 호환
          name: workerData.name,
          birthDate: birthDateStr.replace(/-/g, ''), // YYYYMMDD 형식
          isSenior: isSeniorWorker,
          email: workerData.email || null,
          gender: workerData.gender,
          nationality: workerData.nationality,
          jobTitle: workerData.job_title,
          role: workerData.role,
          status: workerData.status,
          preRegistered: workerData.pre_registered || false,
          isDataConflict: workerData.is_data_conflict || false,
          signatureUrl: workerData.signature_url || null,
          companyId: workerData.company_id?.toString() || '',
          siteId: workerData.site_id?.toString() || '',
          teamId: workerData.partner_id?.toString() || '',
          partnerId: workerData.partner_id?.toString() || '',
          createdAt: workerData.created_at,
        },
        company: workerData.companies ? {
          id: (workerData.companies as any).id?.toString(),
          name: (workerData.companies as any).name,
          address: (workerData.companies as any).address,
        } : null,
        site: workerData.sites ? {
          id: (workerData.sites as any).id?.toString(),
          name: (workerData.sites as any).name,
          address: (workerData.sites as any).address,
          checkoutPolicy: (workerData.sites as any).checkout_policy,
          autoHours: (workerData.sites as any).auto_hours,
        } : null,
        partner: workerData.partners ? {
          id: (workerData.partners as any).id?.toString(),
          name: (workerData.partners as any).name,
        } : null,
        todayAttendance: todayAttendance
          ? {
              checkInTime: todayAttendance.check_in_time,
              checkOutTime: todayAttendance.check_out_time,
              isAutoOut: todayAttendance.is_auto_out,
            }
          : null,
        commuteStatus,
      },
    });
  } catch (error) {
    return serverError(error);
  }
});
