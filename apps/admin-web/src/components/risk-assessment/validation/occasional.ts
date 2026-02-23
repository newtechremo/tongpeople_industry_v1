/**
 * 수시 위험성평가 검증 함수
 *
 * 위험성 산정 방식별 검증 로직 제공
 */

import type {
  OccasionalAssessmentPayload,
  OccasionalRiskFactor,
  OccasionalSubcategory,
  RiskMethod,
  RiskGradeLevel,
  RiskFactorLevel,
  RiskFactorFrequencyIntensity,
} from '../types/occasional';

/**
 * 빈도강도 점수 → 등급 변환
 *
 * 등급 경계값 (확정):
 * - LOW: 1~5점
 * - MEDIUM: 6~14점
 * - HIGH: 15~20점
 */
export function calculateGradeLevel(score: number): RiskGradeLevel {
  if (score >= 15) return 'HIGH';
  if (score >= 6) return 'MEDIUM';
  return 'LOW';
}

/**
 * 빈도강도 검증 (개선 전/후)
 * - beforeFrequency: 1~4
 * - beforeIntensity: 1~5
 * - beforeRiskScore = beforeFrequency * beforeIntensity
 * - beforeGradeLevel = calculateGradeLevel(beforeRiskScore)
 * - afterFrequency: 1~4
 * - afterIntensity: 1~5
 * - afterRiskScore = afterFrequency * afterIntensity
 * - afterGradeLevel = calculateGradeLevel(afterRiskScore)
 */
function validateFrequencyIntensity(factor: RiskFactorFrequencyIntensity): string[] {
  const errors: string[] = [];

  // ========== 개선 전 평가 검증 ==========

  // 빈도 검증
  if (factor.beforeFrequency === null) {
    errors.push('[개선 전] 빈도를 선택해주세요.');
  } else if (factor.beforeFrequency < 1 || factor.beforeFrequency > 4) {
    errors.push('[개선 전] 빈도는 1~4 범위여야 합니다.');
  }

  // 강도 검증
  if (factor.beforeIntensity === null) {
    errors.push('[개선 전] 강도를 선택해주세요.');
  } else if (factor.beforeIntensity < 1 || factor.beforeIntensity > 5) {
    errors.push('[개선 전] 강도는 1~5 범위여야 합니다.');
  }

  // 점수 검증
  if (factor.beforeFrequency !== null && factor.beforeIntensity !== null) {
    const expectedScore = factor.beforeFrequency * factor.beforeIntensity;
    if (factor.beforeRiskScore !== expectedScore) {
      errors.push(`[개선 전] 위험성 점수가 올바르지 않습니다. (기대값: ${expectedScore})`);
    }

    // 등급 검증
    const expectedGrade = calculateGradeLevel(expectedScore);
    if (factor.beforeGradeLevel !== expectedGrade) {
      errors.push(`[개선 전] 위험성 등급이 올바르지 않습니다. (기대값: ${expectedGrade})`);
    }
  }

  // ========== 개선 후 평가 검증 ==========

  // 개선 효과 검증 (개선 전 평가가 완료된 경우에만)
  if (
    factor.beforeRiskScore !== null &&
    factor.afterRiskScore !== null &&
    factor.afterRiskScore > factor.beforeRiskScore
  ) {
    errors.push(
      `[개선 효과] 개선 후 점수(${factor.afterRiskScore})가 개선 전 점수(${factor.beforeRiskScore})보다 높습니다. 개선대책을 재검토해주세요.`
    );
  }

  // 빈도 검증
  if (factor.afterFrequency === null) {
    errors.push('[개선 후] 빈도를 선택해주세요.');
  } else if (factor.afterFrequency < 1 || factor.afterFrequency > 4) {
    errors.push('[개선 후] 빈도는 1~4 범위여야 합니다.');
  }

  // 강도 검증
  if (factor.afterIntensity === null) {
    errors.push('[개선 후] 강도를 선택해주세요.');
  } else if (factor.afterIntensity < 1 || factor.afterIntensity > 5) {
    errors.push('[개선 후] 강도는 1~5 범위여야 합니다.');
  }

  // 점수 검증
  if (factor.afterFrequency !== null && factor.afterIntensity !== null) {
    const expectedScore = factor.afterFrequency * factor.afterIntensity;
    if (factor.afterRiskScore !== expectedScore) {
      errors.push(`[개선 후] 위험성 점수가 올바르지 않습니다. (기대값: ${expectedScore})`);
    }

    // 등급 검증
    const expectedGrade = calculateGradeLevel(expectedScore);
    if (factor.afterGradeLevel !== expectedGrade) {
      errors.push(`[개선 후] 위험성 등급이 올바르지 않습니다. (기대값: ${expectedGrade})`);
    }
  }

  return errors;
}

/**
 * 상중하 검증
 */
function validateLevel(factor: RiskFactorLevel): string[] {
  const errors: string[] = [];

  if (factor.level === null) {
    errors.push('위험성 수준을 선택해주세요.');
  }

  return errors;
}

/**
 * 소분류별 조치 필드 검증
 */
function validateSubcategoryActionFields(subcategory: OccasionalSubcategory): string[] {
  const errors: string[] = [];

  if (!subcategory.actionDate || subcategory.actionDate.trim() === '') {
    errors.push('조치일을 입력해주세요.');
  }

  if (!subcategory.actionAssigneeIds || subcategory.actionAssigneeIds.length === 0) {
    errors.push('조치자를 최소 1명 이상 지정해주세요.');
  }

  if (!subcategory.actionConfirmerIds || subcategory.actionConfirmerIds.length === 0) {
    errors.push('조치확인자를 최소 1명 이상 지정해주세요.');
  }

  return errors;
}

/**
 * 위험요인 방식별 검증
 */
export function validateRiskFactorByMethod(
  factor: OccasionalRiskFactor,
  method: RiskMethod
): string[] {
  const errors: string[] = [];

  // 기본 필드 검증
  if (!factor.factor || factor.factor.trim() === '') {
    errors.push('위험요인을 입력해주세요.');
  }

  if (!factor.improvement || factor.improvement.trim() === '') {
    errors.push('개선대책을 입력해주세요.');
  }

  if (!factor.workPeriodStart || factor.workPeriodStart.trim() === '') {
    errors.push('작업 시작일을 입력해주세요.');
  }

  if (!factor.workPeriodEnd || factor.workPeriodEnd.trim() === '') {
    errors.push('작업 종료일을 입력해주세요.');
  }

  // 방식별 검증
  if (method === 'LEVEL') {
    if ('level' in factor) {
      errors.push(...validateLevel(factor as RiskFactorLevel));
    } else {
      errors.push('위험성 수준 정보가 없습니다.');
    }
  } else if (method === 'FREQUENCY_INTENSITY') {
    if ('beforeFrequency' in factor && 'beforeIntensity' in factor) {
      errors.push(...validateFrequencyIntensity(factor as RiskFactorFrequencyIntensity));
    } else {
      errors.push('빈도강도 정보가 없습니다.');
    }
  }

  return errors;
}

/**
 * 수시 위험성평가 전체 검증
 */
export function validateOccasionalAssessment(
  payload: OccasionalAssessmentPayload
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 기본 정보 검증
  if (!payload.siteName || payload.siteName.trim() === '') {
    errors.push('현장명을 입력해주세요.');
  }

  if (!payload.companyName || payload.companyName.trim() === '') {
    errors.push('회사명을 입력해주세요.');
  }

  if (!payload.teamId || payload.teamId.trim() === '') {
    errors.push('소속팀을 선택해주세요.');
  }

  if (!payload.workPeriodStart || payload.workPeriodStart.trim() === '') {
    errors.push('작업 시작일을 입력해주세요.');
  }

  if (!payload.workPeriodEnd || payload.workPeriodEnd.trim() === '') {
    errors.push('작업 종료일을 입력해주세요.');
  }

  // 수시 평가 특화 필드 검증 (옵션)
  // triggerReason이 있으면 triggerDate도 필수
  const hasTriggerInfo = payload.triggerReason && payload.triggerReason.trim() !== '';
  if (hasTriggerInfo && (!payload.triggerDate || payload.triggerDate.trim() === '')) {
    errors.push('수시 평가 정보를 포함하는 경우 발생일을 입력해주세요.');
  }

  if (!payload.riskMethod) {
    errors.push('위험성 산정 방식을 선택해주세요.');
  }

  // 카테고리 검증
  if (!payload.categories || payload.categories.length === 0) {
    errors.push('최소 1개 이상의 공종을 추가해주세요.');
  } else {
    payload.categories.forEach((category, catIdx) => {
      if (!category.categoryName || category.categoryName.trim() === '') {
        errors.push(`공종 ${catIdx + 1}: 공종명을 입력해주세요.`);
      }

      if (!category.subcategories || category.subcategories.length === 0) {
        errors.push(`공종 ${catIdx + 1}: 최소 1개 이상의 하위 분류를 추가해주세요.`);
      } else {
        category.subcategories.forEach((subcategory, _subIdx) => {
          // 소분류별 조치 필드 검증
          const actionErrors = validateSubcategoryActionFields(subcategory);
          actionErrors.forEach((err) => {
            errors.push(`공종 ${catIdx + 1} > ${subcategory.name}: ${err}`);
          });

          // 위험요인 검증
          if (!subcategory.riskFactors || subcategory.riskFactors.length === 0) {
            errors.push(
              `공종 ${catIdx + 1} > ${subcategory.name}: 최소 1개 이상의 위험요인을 추가해주세요.`
            );
          } else {
            subcategory.riskFactors.forEach((factor, factorIdx) => {
              const factorErrors = validateRiskFactorByMethod(factor, payload.riskMethod);
              factorErrors.forEach((err) => {
                errors.push(
                  `공종 ${catIdx + 1} > ${subcategory.name} > 위험요인 ${factorIdx + 1}: ${err}`
                );
              });
            });
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
