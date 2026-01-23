// 토큰 갱신 Edge Function
// POST /auth/refresh
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse, serverError } from '../_shared/response.ts';
import { refreshAccessToken } from '../_shared/jwt.ts';

interface RefreshTokenRequest {
  refreshToken: string;
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

    const { refreshToken }: RefreshTokenRequest = await req.json();

    // 1. 필수 필드 검증
    if (!refreshToken) {
      return errorResponse('INVALID_TOKEN', '리프레시 토큰이 필요합니다.', 400);
    }

    // 2. 리프레시 토큰으로 새 액세스 토큰 발급
    const result = await refreshAccessToken(refreshToken, supabase);

    if (!result) {
      return errorResponse('TOKEN_EXPIRED', '리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.', 401);
    }

    // 3. 사용자 상태 확인
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, status, name')
      .eq('id', result.userId)
      .single();

    if (userError || !user) {
      return errorResponse('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.', 404);
    }

    // 차단된 사용자 체크
    if (user.status === 'BLOCKED') {
      return errorResponse('FORBIDDEN', '차단된 계정입니다.', 403);
    }

    return successResponse({
      accessToken: result.accessToken,
      userId: result.userId,
      status: user.status,
    });
  } catch (error) {
    return serverError(error);
  }
});
