/**
 * 수시 위험성평가 문서 확인 관련 타입
 *
 * 목적:
 * - 수시 평가 문서 열람 추적
 * - 일자별 확인자 조회
 * - 작업기간 최종 확인자 집계
 */

/**
 * 확인 이벤트 (DB 레코드)
 *
 * 열람 시 자동 등록되며, 같은 사용자/같은 날짜는 1건만 기록됨
 */
export interface AssessmentConfirmationEvent {
  id: string;
  assessmentId: string;
  assessmentType: 'OCCASIONAL';
  confirmedByUserId: string;
  confirmedByUserName: string;
  confirmedByDepartment?: string | null;
  confirmedAt: string; // ISO datetime
  confirmedDate: string; // YYYY-MM-DD (현장 기준)
  source: 'PC' | 'MOBILE';
  createdAt: string;
}

/**
 * 최종 확인자 (작업기간 집계 결과)
 *
 * 작업기간 동안 1회 이상 확인한 고유 사용자
 */
export interface FinalConfirmer {
  userId: string;
  name: string;
  department?: string | null;
  firstConfirmedDate: string; // YYYY-MM-DD
  lastConfirmedDate: string; // YYYY-MM-DD
  confirmedCount: number; // 확인 횟수
}

/**
 * 일자별 확인자 조회 요청
 */
export interface DailyConfirmationRequest {
  assessmentId: string;
  date: string; // YYYY-MM-DD
}

/**
 * 일자별 확인자 조회 응답
 */
export interface DailyConfirmationResponse {
  date: string; // YYYY-MM-DD
  confirmations: AssessmentConfirmationEvent[];
}

/**
 * 작업기간 최종 확인자 조회 요청
 */
export interface FinalConfirmationRequest {
  assessmentId: string;
  workPeriodStart: string; // YYYY-MM-DD
  workPeriodEnd: string; // YYYY-MM-DD
}

/**
 * 작업기간 최종 확인자 조회 응답
 */
export interface FinalConfirmationResponse {
  workPeriodStart: string;
  workPeriodEnd: string;
  confirmers: FinalConfirmer[];
  totalCount: number;
}

/**
 * 확인 이벤트 등록 요청
 */
export interface CreateConfirmationRequest {
  assessmentId: string;
  assessmentType: 'OCCASIONAL';
  source: 'PC' | 'MOBILE';
  // userId, userName, department는 서버에서 인증 정보로부터 추출
}

/**
 * 확인 이벤트 등록 응답
 */
export interface CreateConfirmationResponse {
  success: boolean;
  confirmation?: AssessmentConfirmationEvent;
  alreadyConfirmed?: boolean; // 이미 오늘 확인한 경우
}
