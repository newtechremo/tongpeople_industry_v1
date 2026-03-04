/**
 * 최초 위험성평가 타입 정의
 *
 * 공통 타입(common.ts)을 확장하여 최초 평가 전용 필드 추가
 */

import type {
  SubcategoryBase,
  CategoryBase,
  AssessmentPayloadBase,
} from './common';

// ==================== 최초 평가 타입 ====================

/**
 * 최초 평가 소분류
 *
 * Base와 동일 (추가 필드 없음)
 */
export type InitialSubcategory = SubcategoryBase;

/**
 * 최초 평가 대분류
 *
 * Base와 동일 (추가 필드 없음)
 */
export interface InitialCategory extends CategoryBase {
  subcategories: InitialSubcategory[];
}

/**
 * 최초 위험성평가 Payload
 *
 * 공통 Base + 최초 전용 필드 (현재는 추가 필드 없음)
 */
export interface InitialAssessmentPayload extends AssessmentPayloadBase {
  // 최초 평가 전용 필드 (향후 필요 시 추가)
  // assessmentYear?: string;  // 평가 연도
}

// ==================== 타입 가드 ====================

/**
 * 최초 평가 Payload 체크
 */
export function isInitialAssessmentPayload(
  _payload: AssessmentPayloadBase
): _payload is InitialAssessmentPayload {
  // 현재는 Base와 동일하므로 항상 true
  // 향후 최초 전용 필드 추가 시 검증 로직 추가
  return true;
}
