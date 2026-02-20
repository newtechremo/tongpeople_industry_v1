/**
 * 수시 타입 어댑터
 *
 * 기존 수시 타입(occasional.ts)과 공통 타입(common.ts) 간 변환
 * 향후 수시도 공통 타입으로 마이그레이션할 때까지 브릿지 역할
 */

import type {
  OccasionalRiskFactor,
  OccasionalSubcategory,
  OccasionalCategory,
  OccasionalAssessmentPayload,
  RiskMethod,
} from '../types/occasional';

import type {
  RiskFactor,
  SubcategoryBase,
  CategoryBase,
  AssessmentPayloadBase,
} from '../types/common';

// ==================== 수시 → 공통 타입 변환 ====================

/**
 * 수시 위험요인 → 공통 위험요인
 */
export function occasionalRiskFactorToCommon(
  factor: OccasionalRiskFactor
): RiskFactor {
  // 이미 동일한 구조이므로 타입 캐스팅만
  return factor as RiskFactor;
}

/**
 * 수시 소분류 → 공통 소분류
 */
export function occasionalSubcategoryToCommon(
  subcategory: OccasionalSubcategory
): SubcategoryBase {
  return {
    id: subcategory.id,
    name: subcategory.name,
    isCustom: subcategory.isCustom,
    riskFactors: subcategory.riskFactors.map(occasionalRiskFactorToCommon),
  };
}

/**
 * 수시 대분류 → 공통 대분류
 */
export function occasionalCategoryToCommon(
  category: OccasionalCategory
): CategoryBase {
  return {
    id: category.id,
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    subcategories: category.subcategories.map(occasionalSubcategoryToCommon),
  };
}

/**
 * 수시 Payload → 공통 Payload
 *
 * 주의: 수시 전용 필드(triggerReason, triggerDate, teamId)는 제외됨
 */
export function occasionalPayloadToCommon(
  payload: OccasionalAssessmentPayload
): AssessmentPayloadBase {
  return {
    siteName: payload.siteName,
    companyName: payload.companyName,
    approvalLineId: payload.approvalLineId,
    workPeriodStart: payload.workPeriodStart,
    workPeriodEnd: payload.workPeriodEnd,
    riskMethod: payload.riskMethod,
    categories: payload.categories.map(occasionalCategoryToCommon),
  };
}

// ==================== 공통 → 수시 타입 변환 ====================

/**
 * 공통 위험요인 → 수시 위험요인
 */
export function commonRiskFactorToOccasional(
  factor: RiskFactor
): OccasionalRiskFactor {
  // 이미 동일한 구조이므로 타입 캐스팅만
  return factor as OccasionalRiskFactor;
}

/**
 * 공통 소분류 → 수시 소분류
 *
 * 주의: 조치 정보(actionDate, actionAssigneeIds, actionConfirmerIds)는
 *       기본값으로 초기화됨
 */
export function commonSubcategoryToOccasional(
  subcategory: SubcategoryBase,
  actionDate: string = '',
  actionAssigneeIds: string[] = [],
  actionConfirmerIds: string[] = []
): OccasionalSubcategory {
  return {
    id: subcategory.id,
    name: subcategory.name,
    isCustom: subcategory.isCustom,
    riskFactors: subcategory.riskFactors.map(commonRiskFactorToOccasional),
    actionDate,
    actionAssigneeIds,
    actionConfirmerIds,
  };
}

/**
 * 공통 대분류 → 수시 대분류
 */
export function commonCategoryToOccasional(
  category: CategoryBase
): OccasionalCategory {
  return {
    id: category.id,
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    subcategories: category.subcategories.map((sub) =>
      commonSubcategoryToOccasional(sub)
    ),
  };
}

// ==================== 타입 호환성 체크 ====================

/**
 * 위험성 방식이 호환되는지 체크
 */
export function isRiskMethodCompatible(
  method: RiskMethod
): method is 'LEVEL' | 'FREQUENCY_INTENSITY' {
  return method === 'LEVEL' || method === 'FREQUENCY_INTENSITY';
}

/**
 * 수시 타입이 공통 타입으로 안전하게 변환 가능한지 체크
 */
export function canConvertToCommon(payload: OccasionalAssessmentPayload): boolean {
  // 위험성 방식 체크
  if (!isRiskMethodCompatible(payload.riskMethod)) {
    return false;
  }

  // 카테고리 존재 체크
  if (!payload.categories || payload.categories.length === 0) {
    return false;
  }

  return true;
}
