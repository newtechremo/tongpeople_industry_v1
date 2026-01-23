// 응답 헬퍼 함수
import { corsHeaders } from './cors.ts';

interface ErrorResponse {
  code?: string;
  message: string;
}

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

// 성공 응답
export function successResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// 에러 응답
export function errorResponse(
  code: string,
  message?: string,
  status = 400,
  additionalData?: Record<string, unknown>
): Response {
  const errorMessages: Record<string, string> = {
    INVALID_TOKEN: '유효하지 않은 토큰입니다.',
    TOKEN_EXPIRED: '토큰이 만료되었습니다.',
    INVALID_PHONE_NUMBER: '올바른 전화번호를 입력해주세요.',
    INVALID_CODE: '인증번호가 일치하지 않습니다.',
    CODE_EXPIRED: '인증번호가 만료되었습니다.',
    COMPANY_NOT_FOUND: '존재하지 않는 회사입니다.',
    INVALID_COMPANY_CODE: '유효하지 않은 회사코드입니다.',
    USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
    NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
    ALREADY_CHECKED_IN: '이미 출근 처리되었습니다.',
    NOT_CHECKED_IN: '출근 기록이 없습니다.',
    ALREADY_CHECKED_OUT: '이미 퇴근 처리되었습니다.',
    WORKER_NOT_ACTIVE: '승인되지 않은 계정입니다.',
    DUPLICATE_PHONE: '이미 등록된 전화번호입니다.',
    INVALID_TEAM: '유효하지 않은 팀입니다.',
    SIGNATURE_REQUIRED: '서명이 필요합니다.',
    TOO_MANY_REQUESTS: '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
    SMS_SEND_FAILED: 'SMS 발송에 실패했습니다.',
    SERVER_ERROR: '서버 오류가 발생했습니다.',
    UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
    UNAUTHORIZED: '인증이 필요합니다.',
    FORBIDDEN: '접근 권한이 없습니다.',
  };

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code,
        message: message || errorMessages[code] || '오류가 발생했습니다.',
      },
      ...(additionalData || {}),
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// 서버 에러 응답
export function serverError(error: unknown): Response {
  console.error('Server error:', error);
  return errorResponse('SERVER_ERROR', '서버 오류가 발생했습니다.', 500);
}
