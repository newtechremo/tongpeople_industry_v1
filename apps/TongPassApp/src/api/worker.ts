/**
 * 근로자 관련 API
 * - 내 정보 조회
 * - 출퇴근 처리
 */

import api from './client';
import {Worker, CommuteStatus} from '@/types/user';
import {ApiError} from '@/types/api';

// ==================== 응답 타입 ====================

export interface QRPayloadResponse {
  workerId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
  expiresInSeconds: number;
}

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
    const response = await api.get<{
      success: boolean;
      data: {
        user: Worker;
        company: any;
        site: any;
        partner: any;
        todayAttendance: {
          checkInTime: string;
          checkOutTime: string | null;
          isAutoOut: boolean;
        } | null;
        commuteStatus: CommuteStatus;
      };
    }>('/worker-me');

    // 응답 검증
    if (!response.data?.success || !response.data?.data?.user?.id) {
      throw new ApiError('SERVER_ERROR', '사용자 정보를 불러올 수 없습니다.');
    }

    const {user, todayAttendance, commuteStatus} = response.data.data;

    // GetWorkerMeResponse 형식으로 변환
    return {
      ...user,
      commuteStatus: commuteStatus || 'WORK_OFF',
      checkInTime: todayAttendance?.checkInTime,
      checkOutTime: todayAttendance?.checkOutTime || undefined,
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
    const response = await api.post<CommuteInResponse>('/worker-commute-in');

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
    const response = await api.post<CommuteOutResponse>('/worker-commute-out');

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
 * - worker-me API에서 이미 출퇴근 상태를 제공하므로, 이 함수는 getWorkerMe()를 호출
 */
export async function getTodayCommute(): Promise<{
  status: CommuteStatus;
  checkInTime?: string;
  checkOutTime?: string;
}> {
  try {
    const workerData = await getWorkerMe();
    return {
      status: workerData.commuteStatus,
      checkInTime: workerData.checkInTime,
      checkOutTime: workerData.checkOutTime,
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

/**
 * QR 페이로드 조회
 * - 관리자가 스캔할 QR 코드에 포함될 서명된 데이터 생성
 * - 30초마다 갱신 필요
 */
export async function getQRPayload(): Promise<QRPayloadResponse> {
  try {
    const response = await api.get<{
      success: boolean;
      data: QRPayloadResponse;
    }>('/worker-qr-payload');

    // 응답 검증
    if (!response.data?.success || !response.data?.data?.workerId) {
      throw new ApiError('SERVER_ERROR', 'QR 코드 생성에 실패했습니다.');
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SERVER_ERROR', 'QR 코드 생성에 실패했습니다.');
  }
}

// ==================== 월별 출퇴근 기록 ====================

export interface MonthlyAttendanceRecord {
  workDate: string;
  dayOfWeek: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workHours: number | null;
  status: string;
  isAutoOut: boolean;
  hasAccident: boolean;
  isToday: boolean;
}

export interface MonthlyAttendanceSummary {
  totalDays: number;
  totalHours: number;
  year: number;
  month: number;
}

export interface MonthlyAttendanceResponse {
  summary: MonthlyAttendanceSummary;
  records: MonthlyAttendanceRecord[];
}

export async function getMonthlyAttendance(
  year: number,
  month: number,
): Promise<MonthlyAttendanceResponse> {
  try {
    const response = await api.get<{
      success: boolean;
      data: MonthlyAttendanceResponse;
    }>(`/worker-attendance-monthly?year=${year}&month=${month}`);

    if (!response.data?.success) {
      throw new ApiError('SERVER_ERROR', '출퇴근 기록을 불러올 수 없습니다.');
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('SERVER_ERROR', '출퇴근 기록 조회에 실패했습니다.');
  }
}
