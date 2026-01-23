/**
 * 인증 관련 API
 * - 회사코드 검증
 * - SMS 인증
 * - 근로자 등록
 */

import axios from 'axios';
import api from './client';
import {BASEURL, SUPABASE_ANON_KEY} from '@env';
import {Company, Site, Team} from '@/types/company';
import {PreRegisteredData, WorkerStatus} from '@/types/user';
import {ApiError} from '@/types/api';

// 환경 변수 확인
const API_BASE = BASEURL || 'https://zbqittvnenjgoimlixpn.supabase.co/functions/v1';
const ANON_KEY = SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicWl0dHZuZW5qZ29pbWxpeHBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjI1MjEsImV4cCI6MjA4MzY5ODUyMX0._oUth5WoSvuUwhMn52yxtLOCpXR6998bvGiG96q8M28';

// 디버그 로그 (개발 시에만)
if (__DEV__) {
  console.log('[Auth API] BASEURL:', API_BASE);
  console.log('[Auth API] ANON_KEY exists:', !!ANON_KEY);
}

// 공개 API용 클라이언트 (인증 불필요한 엔드포인트용)
const publicApi = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
  },
});

// ==================== 요청/응답 타입 ====================

// 회사코드 검증
export interface VerifyCompanyCodeRequest {
  companyCode: string;
}

export interface VerifyCompanyCodeResponse {
  success: boolean;
  company: Company;
  sites: Site[];
}

// SMS 인증번호 요청
export interface RequestSmsCodeRequest {
  phoneNumber: string;
}

export interface RequestSmsCodeResponse {
  success: boolean;
  expiresIn: number; // 인증번호 유효시간 (초)
}

// SMS 인증 확인
export interface VerifySmsRequest {
  phoneNumber: string;
  code: string;
}

export interface VerifySmsResponse {
  success: boolean;
  message: string;
  verificationToken: string;

  // 기존 회원 로그인 케이스
  isRegistered?: boolean;
  accessToken?: string;
  refreshToken?: string;
  status?: WorkerStatus;

  // 선등록 데이터 (신규 회원)
  preRegisteredData?: PreRegisteredData;

  // 이직 시나리오 - 기존 유저 정보 (INACTIVE 상태인 경우)
  existingUser?: {
    id: string;
    status: 'INACTIVE';
    companyName: string;
  } | null;
}

// 근로자 등록 (화면에서 사용하는 형태)
export interface RegisterWorkerRequest {
  // 소속
  companyId?: string;
  siteId: string;
  teamId: string;

  // SMS 인증
  verificationToken?: string;
  phoneNumber: string;

  // 비밀번호
  password: string;

  // 근로자 정보
  name: string;
  birthDate: string; // YYYYMMDD 형식
  gender: 'M' | 'F';
  email?: string;
  nationality: string;
  jobTitle: string;

  // 약관 동의
  agreedTerms: string[]; // 동의한 약관 ID 배열

  // 전자서명
  signatureBase64: string; // Base64 이미지
}

// 로그인 응답
export interface LoginWorkerResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  workerId: string;
  status: WorkerStatus;
  name?: string;
}

export interface RegisterWorkerResponse {
  success: boolean;
  message: string;
  // 직접 접근 가능한 필드 (화면에서 사용)
  accessToken: string;
  refreshToken: string;
  workerId: string;
  status: WorkerStatus;
  // 추가 정보
  data?: {
    userId: string;
    name: string;
    phone: string;
    status: WorkerStatus;
    isReactivated?: boolean; // 같은 회사 복귀
    isTransferred?: boolean; // 다른 회사로 이직
    previousCompany?: string;
  };
}

// ==================== API 함수 ====================

/**
 * 회사코드 검증
 * @param companyCode 회사코드 (4~10자리)
 */
export async function verifyCompanyCode(
  companyCode: string,
): Promise<VerifyCompanyCodeResponse> {
  // 입력값 검증
  const trimmedCode = companyCode.trim().toUpperCase();
  if (!trimmedCode || trimmedCode.length < 4 || trimmedCode.length > 10) {
    throw new ApiError(
      'INVALID_COMPANY_CODE',
      '유효한 회사코드를 입력해주세요.',
    );
  }

  try {
    // 공개 API 사용 (인증 불필요)
    const response = await publicApi.post<VerifyCompanyCodeResponse>(
      '/verify-company-code',
      {companyCode: trimmedCode},
    );

    // 응답 데이터 검증
    if (!response.data?.company || !response.data?.sites) {
      throw new ApiError('SERVER_ERROR', '서버 응답이 올바르지 않습니다.');
    }

    return response.data;
  } catch (error: any) {
    console.error('[verifyCompanyCode] Error:', error);
    console.error('[verifyCompanyCode] Error message:', error?.message);
    console.error('[verifyCompanyCode] Error response:', error?.response?.data);

    // ApiError가 아닌 경우 변환
    if (error instanceof ApiError) {
      throw error;
    }

    // Axios 에러에서 상세 정보 추출
    const errorMessage = error?.response?.data?.error?.message
      || error?.message
      || '회사코드 검증에 실패했습니다.';
    throw new ApiError('UNKNOWN_ERROR', errorMessage);
  }
}

/**
 * SMS 인증번호 요청
 * @param phoneNumber 전화번호 (01012345678 형식)
 */
export async function requestSmsCode(
  phoneNumber: string,
): Promise<RequestSmsCodeResponse> {
  // 입력값 검증
  const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanedPhone || cleanedPhone.length < 10 || cleanedPhone.length > 11) {
    throw new ApiError(
      'INVALID_PHONE_NUMBER',
      '올바른 전화번호를 입력해주세요.',
    );
  }

  try {
    // 공개 API 사용 (인증 불필요)
    const response = await publicApi.post<RequestSmsCodeResponse>(
      '/send-sms',
      {
        phone: cleanedPhone,
        purpose: 'SIGNUP',
      },
    );

    return {
      success: true,
      expiresIn: response.data?.expiresIn || 180, // 기본 3분
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SMS_SEND_FAILED', '인증번호 전송에 실패했습니다.');
  }
}

/**
 * SMS 인증 확인
 * @param phoneNumber 전화번호
 * @param code 인증번호 (6자리)
 */
export async function verifySms(
  phoneNumber: string,
  code: string,
): Promise<VerifySmsResponse> {
  // 입력값 검증
  const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  const cleanedCode = code.replace(/[^0-9]/g, '');

  if (!cleanedPhone || cleanedPhone.length < 10) {
    throw new ApiError('INVALID_PHONE_NUMBER');
  }

  if (!cleanedCode || cleanedCode.length !== 6) {
    throw new ApiError('INVALID_CODE', '6자리 인증번호를 입력해주세요.');
  }

  try {
    // 공개 API 사용 (인증 불필요)
    const response = await publicApi.post<VerifySmsResponse>('/verify-sms', {
      phone: cleanedPhone,
      code: cleanedCode,
      purpose: 'SIGNUP',
    });

    // 인증 실패
    if (!response.data?.success) {
      throw new ApiError('INVALID_CODE', '인증번호가 일치하지 않습니다.');
    }

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('UNKNOWN_ERROR', 'SMS 인증에 실패했습니다.');
  }
}

/**
 * 팀 목록 조회
 * @param siteId 현장 ID
 */
export async function getTeams(siteId: string): Promise<Team[]> {
  if (!siteId) {
    throw new ApiError('INVALID_TEAM', '현장 정보가 없습니다.');
  }

  try {
    // 공개 API 사용 (인증 불필요)
    const response = await publicApi.get<Team[]>(`/sites-teams?siteId=${siteId}`);

    // 빈 배열인 경우도 유효한 응답
    return response.data || [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SERVER_ERROR', '팀 목록 조회에 실패했습니다.');
  }
}

/**
 * 근로자 등록
 * @param data 근로자 등록 데이터
 */
export async function registerWorker(
  data: RegisterWorkerRequest,
): Promise<RegisterWorkerResponse> {
  // 필수 필드 검증
  if (
    !data.phoneNumber ||
    !data.password ||
    !data.name ||
    !data.birthDate ||
    !data.gender ||
    !data.nationality ||
    !data.jobTitle ||
    !data.siteId ||
    !data.teamId
  ) {
    throw new ApiError('UNKNOWN_ERROR', '필수 정보가 누락되었습니다.');
  }

  // 비밀번호 유효성 검사 (8자 이상, 영문/숫자/특수문자)
  if (data.password.length < 8) {
    throw new ApiError('INVALID_PASSWORD', '비밀번호는 8자 이상이어야 합니다.');
  }
  if (!/[a-zA-Z]/.test(data.password)) {
    throw new ApiError('INVALID_PASSWORD', '비밀번호에 영문자가 포함되어야 합니다.');
  }
  if (!/[0-9]/.test(data.password)) {
    throw new ApiError('INVALID_PASSWORD', '비밀번호에 숫자가 포함되어야 합니다.');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.password)) {
    throw new ApiError('INVALID_PASSWORD', '비밀번호에 특수문자가 포함되어야 합니다.');
  }

  // 약관 동의 검증
  if (!data.agreedTerms || data.agreedTerms.length === 0) {
    throw new ApiError('UNKNOWN_ERROR', '모든 약관에 동의해주세요.');
  }

  // 서명 검증
  if (!data.signatureBase64 || data.signatureBase64.length < 100) {
    throw new ApiError('SIGNATURE_REQUIRED', '서명이 필요합니다.');
  }

  try {
    // 공개 API 사용 (회원가입 시 인증 토큰 없음)
    const response = await publicApi.post<{
      success: boolean;
      message: string;
      // 새 형식: top-level 토큰
      accessToken?: string;
      refreshToken?: string;
      workerId?: string;
      status?: WorkerStatus;
      // 기존 형식 호환: nested data
      data?: {
        userId: string;
        accessToken?: string;
        refreshToken?: string;
        status: WorkerStatus;
        name?: string;
        phone?: string;
        isPreRegistered?: boolean;
        isReactivated?: boolean;
        isTransferred?: boolean;
        previousCompany?: string;
      };
    }>('/register-worker', {
      phone: data.phoneNumber.replace(/[^0-9]/g, ''),
      password: data.password,
      name: data.name,
      birthDate: data.birthDate.replace(/[^0-9]/g, ''),
      gender: data.gender,
      email: data.email,
      nationality: data.nationality,
      jobTitle: data.jobTitle,
      companyId: data.companyId,
      siteId: data.siteId,
      teamId: data.teamId,
      partnerId: data.teamId, // 백엔드 호환
      agreedTerms: data.agreedTerms,
      signatureImage: data.signatureBase64,
      signatureBase64: data.signatureBase64, // 백엔드 호환
      verificationToken: data.verificationToken,
    });

    // 응답 검증 - 새 형식 또는 기존 형식 모두 지원
    const resData = response.data;
    if (!resData?.success) {
      throw new ApiError('SERVER_ERROR', '서버 응답이 올바르지 않습니다.');
    }

    // 토큰 추출 (top-level 우선, 없으면 nested data에서)
    const accessToken = resData.accessToken || resData.data?.accessToken || '';
    const refreshToken = resData.refreshToken || resData.data?.refreshToken || '';
    const workerId = resData.workerId || resData.data?.userId || '';
    const status = resData.status || resData.data?.status || 'REQUESTED';

    // 화면에서 사용하는 형태로 반환
    return {
      success: true,
      message: resData.message || '가입 요청이 완료되었습니다.',
      accessToken,
      refreshToken,
      workerId,
      status,
      data: {
        userId: workerId,
        name: data.name,
        phone: data.phoneNumber,
        status,
        isReactivated: resData.data?.isReactivated,
        isTransferred: resData.data?.isTransferred,
        previousCompany: resData.data?.previousCompany,
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('UNKNOWN_ERROR', '회원가입에 실패했습니다.');
  }
}

/**
 * 승인 상태 확인
 * @param workerId 근로자 ID
 */
export async function checkWorkerStatus(
  workerId: string,
): Promise<{status: WorkerStatus; name?: string; rejectionReason?: string}> {
  if (!workerId) {
    throw new ApiError('UNKNOWN_ERROR', '근로자 정보가 없습니다.');
  }

  try {
    // 공개 API 사용 (회원가입 직후 토큰이 아직 저장되지 않았을 수 있음)
    const response = await publicApi.get<{
      success?: boolean;
      status: WorkerStatus;
      name?: string;
      rejectionReason?: string;
      approvedAt?: string;
    }>(`/auth-worker-status?workerId=${workerId}`);

    return {
      status: response.data?.status || 'PENDING',
      name: response.data?.name,
      rejectionReason: response.data?.rejectionReason,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SERVER_ERROR', '상태 확인에 실패했습니다.');
  }
}

// ==================== 비밀번호 재설정 ====================

/**
 * 비밀번호 재설정용 SMS 인증번호 요청
 * @param phoneNumber 전화번호
 */
export async function requestSmsCodeForReset(
  phoneNumber: string,
): Promise<RequestSmsCodeResponse> {
  const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanedPhone || cleanedPhone.length < 10 || cleanedPhone.length > 11) {
    throw new ApiError(
      'INVALID_PHONE_NUMBER',
      '올바른 전화번호를 입력해주세요.',
    );
  }

  try {
    // 공개 API 사용 (인증 불필요)
    const response = await publicApi.post<RequestSmsCodeResponse>('/send-sms', {
      phone: cleanedPhone,
      purpose: 'PASSWORD_RESET',
    });

    return {
      success: true,
      expiresIn: response.data?.expiresIn || 180,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SMS_SEND_FAILED', '인증번호 전송에 실패했습니다.');
  }
}

/**
 * 비밀번호 재설정용 SMS 인증 확인
 * @param phoneNumber 전화번호
 * @param code 인증번호
 */
export async function verifySmsForReset(
  phoneNumber: string,
  code: string,
): Promise<VerifySmsResponse> {
  const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  const cleanedCode = code.replace(/[^0-9]/g, '');

  if (!cleanedPhone || cleanedPhone.length < 10) {
    throw new ApiError('INVALID_PHONE_NUMBER');
  }

  if (!cleanedCode || cleanedCode.length !== 6) {
    throw new ApiError('INVALID_CODE', '6자리 인증번호를 입력해주세요.');
  }

  try {
    // 공개 API 사용 (인증 불필요)
    const response = await publicApi.post<VerifySmsResponse>('/verify-sms', {
      phone: cleanedPhone,
      code: cleanedCode,
      purpose: 'PASSWORD_RESET',
    });

    if (!response.data?.success) {
      throw new ApiError('INVALID_CODE', '인증번호가 일치하지 않습니다.');
    }

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('UNKNOWN_ERROR', 'SMS 인증에 실패했습니다.');
  }
}

/**
 * 비밀번호 재설정
 * @param verificationToken 인증 토큰
 * @param newPassword 새 비밀번호
 */
export async function resetPassword(
  verificationToken: string,
  newPassword: string,
): Promise<{success: boolean}> {
  if (!verificationToken) {
    throw new ApiError('INVALID_TOKEN', '인증 정보가 없습니다.');
  }

  if (!newPassword || newPassword.length < 8) {
    throw new ApiError('INVALID_PASSWORD', '비밀번호는 8자 이상이어야 합니다.');
  }

  try {
    // 공개 API 사용 (인증 불필요)
    const response = await publicApi.post<{success: boolean}>('/reset-password', {
      verificationToken,
      newPassword,
    });

    if (!response.data?.success) {
      throw new ApiError('SERVER_ERROR', '비밀번호 변경에 실패했습니다.');
    }

    return {success: true};
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('UNKNOWN_ERROR', '비밀번호 변경에 실패했습니다.');
  }
}

// ==================== 로그인 ====================

/**
 * 비밀번호로 로그인
 * @param phoneNumber 전화번호
 * @param password 비밀번호
 */
export async function loginWithPassword(
  phoneNumber: string,
  password: string,
): Promise<LoginWorkerResponse> {
  // 입력값 검증
  const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanedPhone || cleanedPhone.length < 10 || cleanedPhone.length > 11) {
    throw new ApiError('INVALID_PHONE_NUMBER', '올바른 전화번호를 입력해주세요.');
  }

  if (!password || password.length < 8) {
    throw new ApiError('INVALID_PASSWORD', '비밀번호를 입력해주세요.');
  }

  try {
    const response = await publicApi.post<LoginWorkerResponse>('/login-worker', {
      phone: cleanedPhone,
      password,
      loginType: 'PASSWORD',
    });

    if (!response.data?.success) {
      throw new ApiError('LOGIN_FAILED', '로그인에 실패했습니다.');
    }

    return response.data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // 서버에서 구체적인 에러 메시지가 있으면 사용
    const errorMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      '로그인에 실패했습니다.';
    const errorCode = error?.response?.data?.code || 'LOGIN_FAILED';
    throw new ApiError(errorCode, errorMessage);
  }
}

/**
 * SMS 인증으로 로그인
 * @param phoneNumber 전화번호
 * @param smsCode SMS 인증번호
 */
export async function loginWithSms(
  phoneNumber: string,
  smsCode: string,
): Promise<LoginWorkerResponse> {
  // 입력값 검증
  const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  const cleanedCode = smsCode.replace(/[^0-9]/g, '');

  if (!cleanedPhone || cleanedPhone.length < 10 || cleanedPhone.length > 11) {
    throw new ApiError('INVALID_PHONE_NUMBER', '올바른 전화번호를 입력해주세요.');
  }

  if (!cleanedCode || cleanedCode.length !== 6) {
    throw new ApiError('INVALID_CODE', '6자리 인증번호를 입력해주세요.');
  }

  try {
    const response = await publicApi.post<LoginWorkerResponse>('/login-worker', {
      phone: cleanedPhone,
      smsCode: cleanedCode,
      loginType: 'SMS',
    });

    if (!response.data?.success) {
      throw new ApiError('LOGIN_FAILED', '로그인에 실패했습니다.');
    }

    return response.data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    const errorMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      '로그인에 실패했습니다.';
    const errorCode = error?.response?.data?.code || 'LOGIN_FAILED';
    throw new ApiError(errorCode, errorMessage);
  }
}
