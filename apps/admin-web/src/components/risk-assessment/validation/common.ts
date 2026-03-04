/**
 * 공통 검증 함수 및 인터페이스
 *
 * 모든 위험성평가 타입에서 공통으로 사용하는 검증 로직
 */

import type {
  RiskFactor,
  RiskFactorLevel,
  RiskFactorFrequencyIntensity,
  RiskMethod,
  RiskGradeLevel,
} from '../types/common';

// ==================== 검증 결과 타입 ====================

/**
 * 검증 결과
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 섹션별 검증 함수 시그니처
 */
export type SectionValidator<T> = (data: T) => ValidationResult;

// ==================== 공통 검증 유틸 ====================

/**
 * 빈 문자열 체크
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

/**
 * 필수 필드 검증
 */
export function validateRequired(
  value: string | null | undefined,
  fieldName: string
): string | null {
  return isEmpty(value) ? `${fieldName}을(를) 입력해주세요.` : null;
}

/**
 * 날짜 범위 검증
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
  startFieldName: string = '시작일',
  endFieldName: string = '종료일'
): string | null {
  if (isEmpty(startDate) || isEmpty(endDate)) {
    return null; // 필수 검증은 별도로 수행
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return `${startFieldName}이 ${endFieldName}보다 늦을 수 없습니다.`;
  }

  return null;
}

/**
 * 배열 최소 길이 검증
 */
export function validateMinLength<T>(
  array: T[],
  minLength: number,
  fieldName: string
): string | null {
  if (array.length < minLength) {
    return `최소 ${minLength}개 이상의 ${fieldName}을(를) 추가해주세요.`;
  }
  return null;
}

// ==================== 위험요인 검증 ====================

/**
 * 상중하 방식 검증
 */
export function validateLevel(factor: RiskFactorLevel): string[] {
  const errors: string[] = [];

  if (factor.level === null) {
    errors.push('위험성 수준을 선택해주세요.');
  }

  return errors;
}

/**
 * 등급 계산 (빈도강도)
 *
 * 등급 경계값:
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
 * 빈도강도 방식 검증 (개선 전/후)
 */
export function validateFrequencyIntensity(
  factor: RiskFactorFrequencyIntensity
): string[] {
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
      errors.push(
        `[개선 전] 위험성 점수가 올바르지 않습니다. (기대값: ${expectedScore})`
      );
    }

    // 등급 검증
    const expectedGrade = calculateGradeLevel(expectedScore);
    if (factor.beforeGradeLevel !== expectedGrade) {
      errors.push(
        `[개선 전] 위험성 등급이 올바르지 않습니다. (기대값: ${expectedGrade})`
      );
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
      errors.push(
        `[개선 후] 위험성 점수가 올바르지 않습니다. (기대값: ${expectedScore})`
      );
    }

    // 등급 검증
    const expectedGrade = calculateGradeLevel(expectedScore);
    if (factor.afterGradeLevel !== expectedGrade) {
      errors.push(
        `[개선 후] 위험성 등급이 올바르지 않습니다. (기대값: ${expectedGrade})`
      );
    }
  }

  return errors;
}

/**
 * 위험요인 방식별 검증
 */
export function validateRiskFactorByMethod(
  factor: RiskFactor,
  method: RiskMethod
): string[] {
  const errors: string[] = [];

  // 기본 필드 검증
  const factorError = validateRequired(factor.factor, '위험요인');
  if (factorError) errors.push(factorError);

  const improvementError = validateRequired(factor.improvement, '개선대책');
  if (improvementError) errors.push(improvementError);

  const startError = validateRequired(factor.workPeriodStart, '작업 시작일');
  if (startError) errors.push(startError);

  const endError = validateRequired(factor.workPeriodEnd, '작업 종료일');
  if (endError) errors.push(endError);

  // 날짜 범위 검증
  if (!startError && !endError) {
    const dateRangeError = validateDateRange(
      factor.workPeriodStart,
      factor.workPeriodEnd,
      '작업 시작일',
      '작업 종료일'
    );
    if (dateRangeError) errors.push(dateRangeError);
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

// ==================== 결과 생성 유틸 ====================

/**
 * ValidationResult 생성
 */
export function createValidationResult(errors: string[]): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 여러 검증 결과 병합
 */
export function mergeValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((result) => result.errors);
  return createValidationResult(allErrors);
}
