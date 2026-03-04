/**
 * 워크플로우 무효화 규칙 유틸리티
 *
 * 상태 전이 문서의 무효화 정책 구현:
 * - BASIC_INFO.workPeriodStart/end 변경 → WORK_CATEGORY 위험요인 동기화
 * - RISK_METHOD_CHANGED → WORK_CATEGORY 무효화 (useWorkflow reducer에 구현됨)
 * - 카테고리/소분류 삭제 → 하위 데이터 정리 (form 레벨에서 처리)
 * - 결재라인 필수 정책 변경 → BASIC_INFO 재검증 (validator에서 처리)
 */

import type { OccasionalRiskFactor } from '../types/occasional';

/**
 * 위험요인의 작업기간을 새 기간으로 동기화
 *
 * BASIC_INFO의 workPeriodStart/End가 변경되었을 때 호출
 *
 * @param factors - 동기화할 위험요인 배열
 * @param newStart - 새 시작일
 * @param newEnd - 새 종료일
 * @returns 동기화된 위험요인 배열
 */
export function syncRiskFactorWorkPeriod(
  factors: OccasionalRiskFactor[],
  newStart: string,
  newEnd: string
): OccasionalRiskFactor[] {
  return factors.map((factor) => ({
    ...factor,
    workPeriodStart: newStart,
    workPeriodEnd: newEnd,
  }));
}

/**
 * 모든 카테고리의 위험요인 작업기간을 동기화
 *
 * @param categories - 카테고리 배열
 * @param newStart - 새 시작일
 * @param newEnd - 새 종료일
 * @returns 동기화된 카테고리 배열
 */
export function syncAllRiskFactorsWorkPeriod<
  T extends {
    subcategories: Array<{
      riskFactors: OccasionalRiskFactor[];
    }>;
  }
>(categories: T[], newStart: string, newEnd: string): T[] {
  return categories.map((category) => ({
    ...category,
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      riskFactors: syncRiskFactorWorkPeriod(
        subcategory.riskFactors,
        newStart,
        newEnd
      ),
    })),
  }));
}

/**
 * 작업기간 변경 시 위험요인 검증 필요 여부 확인
 *
 * @param oldStart - 이전 시작일
 * @param oldEnd - 이전 종료일
 * @param newStart - 새 시작일
 * @param newEnd - 새 종료일
 * @returns 재검증이 필요하면 true
 */
export function shouldRevalidateWorkPeriod(
  oldStart: string,
  oldEnd: string,
  newStart: string,
  newEnd: string
): boolean {
  return oldStart !== newStart || oldEnd !== newEnd;
}

/**
 * 위험성 산정 방식 변경 시 위험요인 필터링
 *
 * 방식이 변경되면 기존 위험요인 중 새 방식에 맞지 않는 것들은
 * 위험성 평가 필드를 초기화해야 함
 *
 * @param factors - 위험요인 배열
 * @param newMethod - 새 위험성 산정 방식
 * @returns 필드가 초기화된 위험요인 배열
 */
export function resetRiskFactorsForMethodChange(
  factors: OccasionalRiskFactor[],
  newMethod: 'LEVEL' | 'FREQUENCY_INTENSITY'
): OccasionalRiskFactor[] {
  return factors.map((factor) => {
    const baseFactor = {
      id: factor.id,
      factor: factor.factor,
      improvement: factor.improvement,
      workPeriodStart: factor.workPeriodStart,
      workPeriodEnd: factor.workPeriodEnd,
    };

    // 새 방식에 맞는 필드 구조로 변환
    if (newMethod === 'LEVEL') {
      return {
        ...baseFactor,
        level: null,
      };
    } else {
      return {
        ...baseFactor,
        beforeFrequency: null,
        beforeIntensity: null,
        beforeRiskScore: null,
        beforeGradeLevel: null,
        afterFrequency: null,
        afterIntensity: null,
        afterRiskScore: null,
        afterGradeLevel: null,
      };
    }
  });
}

/**
 * 모든 카테고리의 위험요인을 새 방식으로 초기화
 *
 * @param categories - 카테고리 배열
 * @param newMethod - 새 위험성 산정 방식
 * @returns 초기화된 카테고리 배열
 */
export function resetAllRiskFactorsForMethodChange<
  T extends {
    subcategories: Array<{
      riskFactors: OccasionalRiskFactor[];
    }>;
  }
>(categories: T[], newMethod: 'LEVEL' | 'FREQUENCY_INTENSITY'): T[] {
  return categories.map((category) => ({
    ...category,
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      riskFactors: resetRiskFactorsForMethodChange(
        subcategory.riskFactors,
        newMethod
      ),
    })),
  }));
}

/**
 * 삭제된 소분류 ID들을 카테고리에서 제거
 *
 * @param categories - 카테고리 배열
 * @param categoryId - 대상 카테고리 ID
 * @param subcategoryIdsToRemove - 삭제할 소분류 ID 배열
 * @returns 정리된 카테고리 배열
 */
export function removeSubcategoriesFromCategory<
  T extends {
    id: string;
    subcategories: Array<{ id: number }>;
  }
>(categories: T[], categoryId: string, subcategoryIdsToRemove: number[]): T[] {
  return categories.map((category) => {
    if (category.id !== categoryId) return category;

    return {
      ...category,
      subcategories: category.subcategories.filter(
        (sub) => !subcategoryIdsToRemove.includes(sub.id)
      ),
    };
  });
}
