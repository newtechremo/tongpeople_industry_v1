/**
 * 정기 위험성평가 타입 정의
 *
 * 공통 타입(common.ts)을 확장하여 정기 평가 전용 필드 추가
 */

import type {
  SubcategoryBase,
  CategoryBase,
  AssessmentPayloadBase,
} from './common';

// ==================== 정기 평가 타입 ====================

/**
 * 정기 평가 소분류
 *
 * Base와 동일 (추가 필드 없음)
 */
export type RegularSubcategory = SubcategoryBase;

/**
 * 정기 평가 대분류
 *
 * Base와 동일 (추가 필드 없음)
 */
export interface RegularCategory extends CategoryBase {
  subcategories: RegularSubcategory[];
}

/**
 * 정기 위험성평가 Payload
 *
 * 공통 Base + 정기 전용 필드
 */
export interface RegularAssessmentPayload extends AssessmentPayloadBase {
  // 정기 평가 전용 필드 (향후 필요 시 추가)
  assessmentYear?: string;  // 평가 연도 (예: "2025")
  quarterOrMonth?: string;  // 분기 또는 월 (예: "Q1", "01")
}

// ==================== 타입 가드 ====================

/**
 * 정기 평가 Payload 체크
 */
export function isRegularAssessmentPayload(
  payload: AssessmentPayloadBase
): payload is RegularAssessmentPayload {
  // assessmentYear 필드가 있으면 정기 평가로 간주
  return 'assessmentYear' in payload;
}
