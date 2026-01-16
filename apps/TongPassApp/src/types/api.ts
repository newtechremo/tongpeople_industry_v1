/**
 * API 공통 타입 정의
 */

// API 에러 코드
export type ApiErrorCode =
  // 인증 관련
  | 'INVALID_COMPANY_CODE'
  | 'COMPANY_NOT_FOUND'
  | 'INVALID_PHONE_NUMBER'
  | 'SMS_SEND_FAILED'
  | 'TOO_MANY_REQUESTS'
  | 'INVALID_CODE'
  | 'CODE_EXPIRED'
  | 'DUPLICATE_PHONE'
  | 'INVALID_TEAM'
  | 'SIGNATURE_REQUIRED'
  // 토큰 관련
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'INVALID_REFRESH_TOKEN'
  | 'REFRESH_TOKEN_EXPIRED'
  // 출퇴근 관련
  | 'ALREADY_CHECKED_IN'
  | 'NOT_CHECKED_IN'
  | 'ALREADY_CHECKED_OUT'
  | 'WORKER_NOT_ACTIVE'
  // 일반
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

// API 에러 응답
export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

// API 성공 응답 (공통)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ApiErrorCode;
    message: string;
  };
}

// 에러 코드별 사용자 메시지
export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  // 인증 관련
  INVALID_COMPANY_CODE: '유효하지 않은 회사코드입니다.',
  COMPANY_NOT_FOUND: '존재하지 않는 회사입니다.',
  INVALID_PHONE_NUMBER: '올바른 전화번호를 입력해주세요.',
  SMS_SEND_FAILED: '인증번호 전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
  TOO_MANY_REQUESTS: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  INVALID_CODE: '인증번호가 일치하지 않습니다.',
  CODE_EXPIRED: '인증번호가 만료되었습니다. 다시 요청해주세요.',
  DUPLICATE_PHONE: '이미 등록된 전화번호입니다.',
  INVALID_TEAM: '유효하지 않은 팀입니다.',
  SIGNATURE_REQUIRED: '서명이 필요합니다.',
  // 토큰 관련
  INVALID_TOKEN: '인증 정보가 유효하지 않습니다.',
  TOKEN_EXPIRED: '인증이 만료되었습니다. 다시 로그인해주세요.',
  INVALID_REFRESH_TOKEN: '세션이 만료되었습니다. 다시 로그인해주세요.',
  REFRESH_TOKEN_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',
  // 출퇴근 관련
  ALREADY_CHECKED_IN: '이미 출근 처리되었습니다.',
  NOT_CHECKED_IN: '출근 기록이 없습니다.',
  ALREADY_CHECKED_OUT: '이미 퇴근 처리되었습니다.',
  WORKER_NOT_ACTIVE: '승인되지 않은 계정입니다.',
  // 일반
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};

// 커스텀 API 에러 클래스
export class ApiError extends Error {
  code: ApiErrorCode;
  statusCode?: number;

  constructor(code: ApiErrorCode, message?: string, statusCode?: number) {
    super(
      message || API_ERROR_MESSAGES[code] || '알 수 없는 오류가 발생했습니다.',
    );
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }

  // 사용자에게 보여줄 메시지
  get userMessage(): string {
    return API_ERROR_MESSAGES[this.code] || this.message;
  }

  // 재시도 가능한 에러인지 확인
  get isRetryable(): boolean {
    return ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'].includes(this.code);
  }

  // 로그아웃이 필요한 에러인지 확인
  get requiresLogout(): boolean {
    return [
      'INVALID_TOKEN',
      'TOKEN_EXPIRED',
      'INVALID_REFRESH_TOKEN',
      'REFRESH_TOKEN_EXPIRED',
    ].includes(this.code);
  }
}
