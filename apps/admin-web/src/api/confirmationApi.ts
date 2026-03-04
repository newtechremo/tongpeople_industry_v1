/**
 * 수시 위험성평가 문서 확인 API
 *
 * 현재는 localStorage 기반 mock 구현
 * 추후 Supabase 연동으로 교체 가능
 */

import type {
  AssessmentConfirmationEvent,
  CreateConfirmationRequest,
  CreateConfirmationResponse,
  DailyConfirmationResponse,
  FinalConfirmationResponse,
  FinalConfirmer,
} from '@/components/risk-assessment/types/confirmation';

// 로컬 스토리지 키
const CONFIRMATIONS_STORAGE_KEY = 'tong-pass:assessment-confirmations';

/**
 * 로컬 스토리지에서 모든 확인 이벤트 가져오기
 */
function getAllConfirmations(): AssessmentConfirmationEvent[] {
  const stored = localStorage.getItem(CONFIRMATIONS_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * 로컬 스토리지에 확인 이벤트 저장
 */
function saveConfirmations(confirmations: AssessmentConfirmationEvent[]): void {
  localStorage.setItem(CONFIRMATIONS_STORAGE_KEY, JSON.stringify(confirmations));
}

/**
 * 확인 이벤트 등록
 *
 * - 같은 사용자/같은 날짜는 1건만 등록
 * - userId, userName, department는 실제로는 서버 인증에서 가져와야 함
 */
export async function createConfirmation(
  request: CreateConfirmationRequest,
  currentUser: { id: string; name: string; department?: string }
): Promise<CreateConfirmationResponse> {
  const confirmations = getAllConfirmations();

  // 오늘 날짜 (YYYY-MM-DD)
  const now = new Date();
  const confirmedDate = now.toISOString().split('T')[0];

  // 중복 체크: 같은 평가/같은 사용자/같은 날짜
  const alreadyExists = confirmations.some(
    (c) =>
      c.assessmentId === request.assessmentId &&
      c.confirmedByUserId === currentUser.id &&
      c.confirmedDate === confirmedDate
  );

  if (alreadyExists) {
    return {
      success: true,
      alreadyConfirmed: true,
    };
  }

  // 새 확인 이벤트 생성
  const newConfirmation: AssessmentConfirmationEvent = {
    id: crypto.randomUUID(),
    assessmentId: request.assessmentId,
    assessmentType: request.assessmentType,
    confirmedByUserId: currentUser.id,
    confirmedByUserName: currentUser.name,
    confirmedByDepartment: currentUser.department || null,
    confirmedAt: now.toISOString(),
    confirmedDate,
    source: request.source,
    createdAt: now.toISOString(),
  };

  confirmations.push(newConfirmation);
  saveConfirmations(confirmations);

  return {
    success: true,
    confirmation: newConfirmation,
    alreadyConfirmed: false,
  };
}

/**
 * 일자별 확인자 조회
 */
export async function getDailyConfirmations(
  assessmentId: string,
  date: string
): Promise<DailyConfirmationResponse> {
  const confirmations = getAllConfirmations();

  const filtered = confirmations.filter(
    (c) => c.assessmentId === assessmentId && c.confirmedDate === date
  );

  return {
    date,
    confirmations: filtered,
  };
}

/**
 * 작업기간 최종 확인자 집계
 *
 * 작업기간 동안 1회 이상 확인한 고유 사용자 목록
 */
export async function getFinalConfirmers(
  assessmentId: string,
  workPeriodStart: string,
  workPeriodEnd: string
): Promise<FinalConfirmationResponse> {
  const confirmations = getAllConfirmations();

  // 작업기간 내 확인 이벤트 필터링
  const filtered = confirmations.filter((c) => {
    if (c.assessmentId !== assessmentId) return false;
    return c.confirmedDate >= workPeriodStart && c.confirmedDate <= workPeriodEnd;
  });

  // userId별로 그룹화하여 집계
  const userMap = new Map<string, FinalConfirmer>();

  filtered.forEach((c) => {
    const existing = userMap.get(c.confirmedByUserId);

    if (!existing) {
      userMap.set(c.confirmedByUserId, {
        userId: c.confirmedByUserId,
        name: c.confirmedByUserName,
        department: c.confirmedByDepartment,
        firstConfirmedDate: c.confirmedDate,
        lastConfirmedDate: c.confirmedDate,
        confirmedCount: 1,
      });
    } else {
      // 최초/최종 날짜 업데이트
      if (c.confirmedDate < existing.firstConfirmedDate) {
        existing.firstConfirmedDate = c.confirmedDate;
      }
      if (c.confirmedDate > existing.lastConfirmedDate) {
        existing.lastConfirmedDate = c.confirmedDate;
      }
      existing.confirmedCount += 1;
    }
  });

  const confirmers = Array.from(userMap.values());

  return {
    workPeriodStart,
    workPeriodEnd,
    confirmers,
    totalCount: confirmers.length,
  };
}
