/**
 * 워크플로우 섹션별 검증 함수
 *
 * useWorkflow에서 사용할 Guard 조건 검증
 * 각 섹션의 완료 조건을 검증하여 다음 단계 진행 가능 여부 판단
 */

import type {
  RiskMethod,
  OccasionalRiskFactor,
} from '../types/occasional';
import { validateRiskFactorByMethod } from './occasional';

// ==================== 타입 정의 ====================

/**
 * 기본 정보 데이터
 */
export interface BasicInfoData {
  siteName: string;
  companyName: string;
  teamId: string;
  workPeriodStart: string;
  workPeriodEnd: string;
  approvalLineId: string | null;
}

/**
 * 수시 평가 정보 데이터
 */
export interface OccasionalInfoData {
  includeTriggerInfo: boolean;
  triggerDate: string;
  triggerReason: string;
}

/**
 * 위험성 산정 방식 데이터
 */
export interface RiskMethodData {
  riskMethod: RiskMethod | null;
}

/**
 * 소분류 데이터 (조치 필드 포함)
 */
export interface WorkCategorySubcategory {
  id: number;
  name: string;
  isCustom?: boolean;
  riskFactors: OccasionalRiskFactor[];
  actionDate: string;
  actionAssigneeIds: string[];
  actionConfirmerIds: string[];
  reviewComments?: string[];
}

/**
 * 작업 공종 데이터
 */
export interface WorkCategoryData {
  riskMethod: RiskMethod;
  categories: {
    id: string;
    categoryId: number | null;
    categoryName: string;
    subcategories: WorkCategorySubcategory[];
  }[];
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ==================== 정책 설정 ====================

/**
 * 결재라인 필수 정책
 * TODO: 실제로는 현장 설정에서 가져와야 함
 */
const APPROVAL_LINE_REQUIRED = false;

// ==================== 섹션별 검증 함수 ====================

/**
 * BASIC_INFO 섹션 검증
 *
 * 완료 조건:
 * - teamId 유효
 * - workPeriodStart/workPeriodEnd 유효
 * - 결재라인이 필수 정책이면 approvalLineId 존재
 */
export function validateBasicInfo(data: BasicInfoData): ValidationResult {
  const errors: string[] = [];

  // 현장명 검증
  if (!data.siteName || data.siteName.trim() === '') {
    errors.push('현장명을 입력해주세요.');
  }

  // 회사명 검증
  if (!data.companyName || data.companyName.trim() === '') {
    errors.push('회사명을 입력해주세요.');
  }

  // 소속팀 검증
  if (!data.teamId || data.teamId.trim() === '') {
    errors.push('소속팀을 선택해주세요.');
  }

  // 작업기간 검증
  if (!data.workPeriodStart || data.workPeriodStart.trim() === '') {
    errors.push('작업 시작일을 입력해주세요.');
  }

  if (!data.workPeriodEnd || data.workPeriodEnd.trim() === '') {
    errors.push('작업 종료일을 입력해주세요.');
  }

  // 작업기간 유효성 검증 (시작일 <= 종료일)
  if (data.workPeriodStart && data.workPeriodEnd) {
    const startDate = new Date(data.workPeriodStart);
    const endDate = new Date(data.workPeriodEnd);
    if (startDate > endDate) {
      errors.push('작업 종료일은 시작일 이후여야 합니다.');
    }
  }

  // 결재라인 검증 (정책에 따라)
  if (APPROVAL_LINE_REQUIRED && !data.approvalLineId) {
    errors.push('결재라인을 선택해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * OCCASIONAL_INFO 섹션 검증
 *
 * 완료 조건:
 * - includeTriggerInfo = false 이면 완료
 * - includeTriggerInfo = true 이면 triggerDate + triggerReason 모두 유효
 */
export function validateOccasionalInfo(data: OccasionalInfoData): ValidationResult {
  const errors: string[] = [];

  // 수시 평가 정보를 포함하지 않으면 항상 유효
  if (!data.includeTriggerInfo) {
    return {
      isValid: true,
      errors: [],
    };
  }

  // 포함하는 경우 발생일 + 사유 필수
  if (!data.triggerDate || data.triggerDate.trim() === '') {
    errors.push('발생일을 입력해주세요.');
  }

  if (!data.triggerReason || data.triggerReason.trim() === '') {
    errors.push('수시 평가 사유를 입력해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * RISK_METHOD 섹션 검증
 *
 * 완료 조건:
 * - riskMethod in ['LEVEL', 'FREQUENCY_INTENSITY']
 */
export function validateRiskMethod(data: RiskMethodData): ValidationResult {
  const errors: string[] = [];

  if (!data.riskMethod) {
    errors.push('위험성 산정 방식을 선택해주세요.');
  } else if (data.riskMethod !== 'LEVEL' && data.riskMethod !== 'FREQUENCY_INTENSITY') {
    errors.push('올바른 위험성 산정 방식을 선택해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * WORK_CATEGORY 섹션 검증
 *
 * 완료 조건:
 * - 카테고리 1개 이상
 * - 각 카테고리에 소분류 1개 이상
 * - 각 소분류에 위험요인 1개 이상
 * - 각 소분류의 공통 조치 필드(actionDate, actionAssigneeIds, actionConfirmerIds) 유효
 * - 선택한 riskMethod 기준 위험요인 입력 필드 유효
 */
export function validateWorkCategory(data: WorkCategoryData): ValidationResult {
  const errors: string[] = [];

  // 카테고리 개수 검증
  if (!data.categories || data.categories.length === 0) {
    errors.push('최소 1개 이상의 작업 공종(대분류)을 추가해주세요.');
    return {
      isValid: false,
      errors,
    };
  }

  // 각 카테고리 검증
  data.categories.forEach((category, catIdx) => {
    const catPrefix = `공종 ${catIdx + 1}`;

    // 카테고리명 검증
    if (!category.categoryName || category.categoryName.trim() === '') {
      errors.push(`${catPrefix}: 공종명을 입력해주세요.`);
    }

    // 소분류 개수 검증
    if (!category.subcategories || category.subcategories.length === 0) {
      errors.push(`${catPrefix}: 최소 1개 이상의 소분류를 추가해주세요.`);
      return;
    }

    // 각 소분류 검증
    category.subcategories.forEach((subcategory, _subIdx) => {
      const subPrefix = `${catPrefix} > ${subcategory.name}`;

      // 위험요인 개수 검증
      if (!subcategory.riskFactors || subcategory.riskFactors.length === 0) {
        errors.push(`${subPrefix}: 최소 1개 이상의 위험요인을 추가해주세요.`);
      }

      // 소분류별 조치 필드 검증
      if (!subcategory.actionDate || subcategory.actionDate.trim() === '') {
        errors.push(`${subPrefix}: 조치일을 입력해주세요.`);
      }

      if (!subcategory.actionAssigneeIds || subcategory.actionAssigneeIds.length === 0) {
        errors.push(`${subPrefix}: 조치자를 최소 1명 이상 지정해주세요.`);
      }

      if (!subcategory.actionConfirmerIds || subcategory.actionConfirmerIds.length === 0) {
        errors.push(`${subPrefix}: 조치확인자를 최소 1명 이상 지정해주세요.`);
      }

      // 각 위험요인 검증 (방식별)
      subcategory.riskFactors.forEach((factor, factorIdx) => {
        const factorPrefix = `${subPrefix} > 위험요인 ${factorIdx + 1}`;
        const factorErrors = validateRiskFactorByMethod(factor, data.riskMethod);
        factorErrors.forEach((err) => {
          errors.push(`${factorPrefix}: ${err}`);
        });
      });
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ==================== 헬퍼 함수 ====================

/**
 * 전체 폼 데이터 검증 (모든 섹션)
 *
 * 최종 제출 시 사용
 */
export function validateAllSections(
  basicInfo: BasicInfoData,
  occasionalInfo: OccasionalInfoData,
  riskMethod: RiskMethodData,
  workCategory: WorkCategoryData
): ValidationResult {
  const allErrors: string[] = [];

  const basicResult = validateBasicInfo(basicInfo);
  if (!basicResult.isValid) {
    allErrors.push(...basicResult.errors.map((err) => `[기본 정보] ${err}`));
  }

  const occasionalResult = validateOccasionalInfo(occasionalInfo);
  if (!occasionalResult.isValid) {
    allErrors.push(...occasionalResult.errors.map((err) => `[수시 평가 정보] ${err}`));
  }

  const riskMethodResult = validateRiskMethod(riskMethod);
  if (!riskMethodResult.isValid) {
    allErrors.push(...riskMethodResult.errors.map((err) => `[위험성 산정 방식] ${err}`));
  }

  const workCategoryResult = validateWorkCategory(workCategory);
  if (!workCategoryResult.isValid) {
    allErrors.push(...workCategoryResult.errors.map((err) => `[작업 공종] ${err}`));
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}
