/**
 * 인증 관련 API
 * - 회사코드 검증
 * - SMS 인증
 * - 근로자 등록
 */

import api from './client';
import {Company, Site, Team} from '@/types/company';
import {PreRegisteredData, WorkerStatus} from '@/types/user';
import {ApiError} from '@/types/api';

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
  verified: boolean;
  isRegistered: boolean;
  preRegisteredData?: PreRegisteredData;
  accessToken?: string;
  refreshToken?: string;
  workerId?: string;
  status?: WorkerStatus;
}

// 근로자 등록
export interface RegisterWorkerRequest {
  siteId: string;
  teamId: string;
  phoneNumber: string;
  name: string;
  birthDate: string; // YYYYMMDD 형식
  email?: string;
  gender: 'M' | 'F';
  nationality: string;
  jobTitle: string;
  signatureBase64: string;
  agreedTerms: string[]; // 동의한 약관 ID 배열
  isDataConflict?: boolean;
}

export interface RegisterWorkerResponse {
  success: boolean;
  workerId: string;
  status: WorkerStatus;
  accessToken: string;
  refreshToken: string;
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
    const response = await api.post<VerifyCompanyCodeResponse>(
      '/auth/verify-company-code',
      {companyCode: trimmedCode},
    );

    // 응답 데이터 검증
    if (!response.data?.company || !response.data?.sites) {
      throw new ApiError('SERVER_ERROR', '서버 응답이 올바르지 않습니다.');
    }

    return response.data;
  } catch (error) {
    // ApiError가 아닌 경우 변환
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('UNKNOWN_ERROR', '회사코드 검증에 실패했습니다.');
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
    const response = await api.post<RequestSmsCodeResponse>(
      '/auth/request-sms',
      {phoneNumber: cleanedPhone},
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
    const response = await api.post<VerifySmsResponse>('/auth/verify-sms', {
      phoneNumber: cleanedPhone,
      code: cleanedCode,
    });

    // 인증 실패
    if (!response.data?.verified) {
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
    const response = await api.get<Team[]>(`/sites/${siteId}/teams`);

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
  const requiredFields: (keyof RegisterWorkerRequest)[] = [
    'siteId',
    'teamId',
    'phoneNumber',
    'name',
    'birthDate',
    'gender',
    'nationality',
    'jobTitle',
    'signatureBase64',
    'agreedTerms',
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new ApiError(
        'UNKNOWN_ERROR',
        `필수 정보(${field})가 누락되었습니다.`,
      );
    }
  }

  // 서명 검증
  if (!data.signatureBase64 || data.signatureBase64.length < 100) {
    throw new ApiError('SIGNATURE_REQUIRED', '서명이 필요합니다.');
  }

  // 약관 동의 검증
  if (!data.agreedTerms || data.agreedTerms.length < 4) {
    throw new ApiError('UNKNOWN_ERROR', '모든 약관에 동의해주세요.');
  }

  try {
    const response = await api.post<RegisterWorkerResponse>(
      '/auth/register-worker',
      {
        ...data,
        phoneNumber: data.phoneNumber.replace(/[^0-9]/g, ''),
        birthDate: data.birthDate.replace(/[^0-9]/g, ''),
      },
    );

    // 응답 검증
    if (!response.data?.workerId || !response.data?.accessToken) {
      throw new ApiError('SERVER_ERROR', '서버 응답이 올바르지 않습니다.');
    }

    return response.data;
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
): Promise<{status: WorkerStatus}> {
  if (!workerId) {
    throw new ApiError('UNKNOWN_ERROR', '근로자 정보가 없습니다.');
  }

  try {
    const response = await api.get<{status: WorkerStatus}>(
      `/auth/worker-status/${workerId}`,
    );

    return {
      status: response.data?.status || 'PENDING',
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SERVER_ERROR', '상태 확인에 실패했습니다.');
  }
}
