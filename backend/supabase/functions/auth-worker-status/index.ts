// 근로자 승인 상태 확인 Edge Function
// GET /auth/worker-status/:workerId
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';
import { verifyAuthHeader } from '../_shared/jwt.ts';

interface WorkerStatusResponse {
  status: 'PENDING' | 'REQUESTED' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'REJECTED';
  name?: string;
  rejectionReason?: string;
  approvedAt?: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // URL에서 workerId 추출
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    // 경로에서 workerId 추출 시도
    let workerId: string | null = null;

    // /auth/worker-status/:workerId 형식
    const statusIndex = pathParts.findIndex(p => p === 'worker-status');
    if (statusIndex !== -1 && pathParts[statusIndex + 1]) {
      workerId = pathParts[statusIndex + 1];
    }

    // 쿼리 파라미터에서 추출
    if (!workerId) {
      workerId = url.searchParams.get('workerId');
    }

    // POST 요청으로 받을 수도 있음
    if (!workerId && req.method === 'POST') {
      try {
        const body = await req.json();
        workerId = body.workerId;
      } catch {
        // JSON 파싱 실패 무시
      }
    }

    // Authorization 헤더로 인증된 경우 본인 ID 사용
    if (!workerId) {
      const userId = await verifyAuthHeader(req);
      if (userId) {
        workerId = userId;
      }
    }

    if (!workerId) {
      return errorResponse('INVALID_TOKEN', '근로자 ID가 필요합니다.', 400);
    }

    // 사용자 상태 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, status, rejection_reason, approved_at')
      .eq('id', workerId)
      .single();

    if (error || !user) {
      return errorResponse('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.', 404);
    }

    const response: WorkerStatusResponse = {
      status: user.status,
      name: user.name,
    };

    // 반려된 경우 사유 포함
    if (user.status === 'REJECTED' && user.rejection_reason) {
      response.rejectionReason = user.rejection_reason;
    }

    // 승인된 경우 승인 시간 포함
    if (user.status === 'ACTIVE' && user.approved_at) {
      response.approvedAt = user.approved_at;
    }

    return successResponse({ status: response.status, ...response });
  } catch (error) {
    return serverError(error);
  }
});
