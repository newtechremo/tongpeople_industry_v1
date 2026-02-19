/**
 * 수시 위험성평가 검증 함수
 *
 * 위험성 산정 방식별 검증 로직 제공
 */

import type {
  OccasionalAssessmentPayload,
  OccasionalRiskFactor,
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
 * 빈도강도 검증
 * - frequency: 1~4
 * - intensity: 1~5
 * - riskScore = frequency * intensity
 * - gradeLevel = calculateGradeLevel(riskScore)
 */
function validateFrequencyIntensity(factor: RiskFactorFrequencyIntensity): string[] {
  const errors: string[] = [];

  // 빈도 검증
  if (factor.frequency === null) {
    errors.push('빈도를 선택해주세요.');
  } else if (factor.frequency < 1 || factor.frequency > 4) {
    errors.push('빈도는 1~4 범위여야 합니다.');
  }

  // 강도 검증
  if (factor.intensity === null) {
    errors.push('강도를 선택해주세요.');
  } else if (factor.intensity < 1 || factor.intensity > 5) {
    errors.push('강도는 1~5 범위여야 합니다.');
  }

  // 점수 검증
  if (factor.frequency !== null && factor.intensity !== null) {
    const expectedScore = factor.frequency * factor.intensity;
    if (factor.riskScore !== expectedScore) {
      errors.push(`위험성 점수가 올바르지 않습니다. (기대값: ${expectedScore})`);
    }

    // 등급 검증
    const expectedGrade = calculateGradeLevel(expectedScore);
    if (factor.gradeLevel !== expectedGrade) {
      errors.push(`위험성 등급이 올바르지 않습니다. (기대값: ${expectedGrade})`);
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
 * 공통 조치 필드 검증
 */
function validateActionFields(factor: OccasionalRiskFactor): string[] {
  const errors: string[] = [];

  if (!factor.actionDate || factor.actionDate.trim() === '') {
    errors.push('조치일을 입력해주세요.');
  }

  if (!factor.actionAssigneeIds || factor.actionAssigneeIds.length === 0) {
    errors.push('조치자를 최소 1명 이상 지정해주세요.');
  }

  if (!factor.actionConfirmerIds || factor.actionConfirmerIds.length === 0) {
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

  // 공통 조치 필드 검증
  errors.push(...validateActionFields(factor));

  // 방식별 검증
  if (method === 'LEVEL') {
    if ('level' in factor) {
      errors.push(...validateLevel(factor as RiskFactorLevel));
    } else {
      errors.push('위험성 수준 정보가 없습니다.');
    }
  } else if (method === 'FREQUENCY_INTENSITY') {
    if ('frequency' in factor && 'intensity' in factor) {
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
        category.subcategories.forEach((subcategory, subIdx) => {
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
