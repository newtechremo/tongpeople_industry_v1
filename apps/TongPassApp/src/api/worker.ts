/**
 * 근로자 관련 API
 * - 내 정보 조회
 * - 출퇴근 처리
 */

import api from './client';
import {Worker, CommuteStatus} from '@/types/user';
import {ApiError} from '@/types/api';

// ==================== 응답 타입 ====================

export interface GetWorkerMeResponse extends Worker {
  commuteStatus: CommuteStatus;
  checkInTime?: string; // ISO 8601 형식
  checkOutTime?: string;
}

export interface CommuteInResponse {
  success: boolean;
  checkInTime: string; // ISO 8601 형식
  commuteStatus: CommuteStatus;
}

export interface CommuteOutResponse {
  success: boolean;
  checkOutTime: string; // ISO 8601 형식
  workDuration: number; // 근무시간 (분)
  commuteStatus: CommuteStatus;
}

// ==================== API 함수 ====================

/**
 * 내 정보 조회
 * - 로그인된 근로자의 정보와 현재 출퇴근 상태를 조회
 */
export async function getWorkerMe(): Promise<GetWorkerMeResponse> {
  try {
    const response = await api.get<GetWorkerMeResponse>('/worker/me');

    // 응답 검증
    if (!response.data?.id) {
      throw new ApiError('SERVER_ERROR', '사용자 정보를 불러올 수 없습니다.');
    }

    // 기본값 설정
    return {
      ...response.data,
      commuteStatus: response.data.commuteStatus || 'WORK_OFF',
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SERVER_ERROR', '정보 조회에 실패했습니다.');
  }
}

/**
 * 출근 처리
 */
export async function commuteIn(): Promise<CommuteInResponse> {
  try {
    const response = await api.post<CommuteInResponse>('/worker/commute-in');

    // 응답 검증
    if (!response.data?.success) {
      throw new ApiError('SERVER_ERROR', '출근 처리에 실패했습니다.');
    }

    return {
      success: true,
      checkInTime: response.data.checkInTime || new Date().toISOString(),
      commuteStatus: 'WORK_ON',
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SERVER_ERROR', '출근 처리에 실패했습니다.');
  }
}

/**
 * 퇴근 처리
 */
export async function commuteOut(): Promise<CommuteOutResponse> {
  try {
    const response = await api.post<CommuteOutResponse>('/worker/commute-out');

    // 응답 검증
    if (!response.data?.success) {
      throw new ApiError('SERVER_ERROR', '퇴근 처리에 실패했습니다.');
    }

    return {
      success: true,
      checkOutTime: response.data.checkOutTime || new Date().toISOString(),
      workDuration: response.data.workDuration || 0,
      commuteStatus: 'WORK_DONE',
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SERVER_ERROR', '퇴근 처리에 실패했습니다.');
  }
}

/**
 * 오늘의 출퇴근 상태 조회
 */
export async function getTodayCommute(): Promise<{
  status: CommuteStatus;
  checkInTime?: string;
  checkOutTime?: string;
}> {
  try {
    const response = await api.get<{
      status: CommuteStatus;
      checkInTime?: string;
      checkOutTime?: string;
    }>('/worker/today-commute');

    return {
      status: response.data?.status || 'WORK_OFF',
      checkInTime: response.data?.checkInTime,
      checkOutTime: response.data?.checkOutTime,
    };
  } catch (error) {
    // 에러 발생 시 기본값 반환 (네트워크 에러 등)
    if (__DEV__) {
      console.warn('[worker.ts] getTodayCommute error:', error);
    }
    return {
      status: 'WORK_OFF',
    };
  }
}
