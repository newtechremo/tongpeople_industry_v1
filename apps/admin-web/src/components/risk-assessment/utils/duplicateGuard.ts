/**
 * 중복 검사 유틸리티
 *
 * 대분류/소분류/위험요인 중복 검사
 */

import { areStringsEqual } from './stringNormalize';
import type { CategoryBase, SubcategoryBase, RiskFactor } from '../types/common';

// ==================== 대분류 중복 검사 ====================

/**
 * 사용된 대분류 ID 목록 추출
 *
 * @param categories - 카테고리 배열
 * @returns 사용된 categoryId 배열
 */
export function getUsedCategoryIds(categories: CategoryBase[]): number[] {
  return categories
    .map((cat) => cat.categoryId)
    .filter((id): id is number => id !== null);
}

/**
 * 사용된 대분류 이름 목록 추출 (커스텀 대분류용)
 *
 * @param categories - 카테고리 배열
 * @returns 정규화된 대분류 이름 배열
 */
export function getUsedCategoryNames(categories: CategoryBase[]): string[] {
  return categories.map((cat) => cat.categoryName);
}

/**
 * 대분류 중복 체크
 *
 * @param categories - 현재 카테고리 배열
 * @param categoryId - 체크할 categoryId (null이면 커스텀)
 * @param categoryName - 체크할 categoryName
 * @param excludeId - 제외할 카테고리 ID (현재 선택 중인 항목)
 * @returns 중복이면 true
 */
export function isCategoryDuplicate(
  categories: CategoryBase[],
  categoryId: number | null,
  categoryName: string,
  excludeId?: string
): boolean {
  return categories.some((cat) => {
    // 자기 자신은 제외
    if (excludeId && cat.id === excludeId) {
      return false;
    }

    // ID 기반 중복 검사 (마스터 데이터)
    if (categoryId !== null && cat.categoryId === categoryId) {
      return true;
    }

    // 이름 기반 중복 검사 (커스텀 또는 마스터 이름 비교)
    return areStringsEqual(cat.categoryName, categoryName);
  });
}

// ==================== 소분류 중복 검사 ====================

/**
 * 특정 대분류 내에서 사용된 소분류 ID 목록 추출
 *
 * @param category - 대분류
 * @returns 사용된 소분류 ID 배열
 */
export function getUsedSubcategoryIds(category: CategoryBase): number[] {
  return category.subcategories.map((sub) => sub.id);
}

/**
 * 특정 대분류 내에서 사용된 소분류 이름 목록 추출
 *
 * @param category - 대분류
 * @returns 정규화된 소분류 이름 배열
 */
export function getUsedSubcategoryNames(category: CategoryBase): string[] {
  return category.subcategories.map((sub) => sub.name);
}

/**
 * 소분류 중복 체크 (동일 대분류 내)
 *
 * @param category - 대분류
 * @param subcategoryId - 체크할 소분류 ID
 * @param subcategoryName - 체크할 소분류 이름
 * @param excludeId - 제외할 소분류 ID (현재 선택 중인 항목)
 * @returns 중복이면 true
 */
export function isSubcategoryDuplicate(
  category: CategoryBase,
  subcategoryId: number,
  subcategoryName: string,
  excludeId?: number
): boolean {
  return category.subcategories.some((sub) => {
    // 자기 자신은 제외
    if (excludeId && sub.id === excludeId) {
      return false;
    }

    // ID 기반 중복 검사
    if (sub.id === subcategoryId) {
      return true;
    }

    // 이름 기반 중복 검사
    return areStringsEqual(sub.name, subcategoryName);
  });
}

// ==================== 위험요인 중복 검사 ====================

/**
 * 특정 소분류 내에서 사용된 위험요인 이름 목록 추출
 *
 * @param subcategory - 소분류
 * @returns 정규화된 위험요인 이름 배열
 */
export function getUsedRiskFactorNames(subcategory: SubcategoryBase): string[] {
  return subcategory.riskFactors.map((factor) => factor.factor);
}

/**
 * 위험요인 중복 체크 (동일 소분류 내)
 *
 * @param subcategory - 소분류
 * @param factorName - 체크할 위험요인 이름
 * @param excludeId - 제외할 위험요인 ID (현재 선택 중인 항목)
 * @returns 중복이면 true
 */
export function isRiskFactorDuplicate(
  subcategory: SubcategoryBase,
  factorName: string,
  excludeId?: string
): boolean {
  return subcategory.riskFactors.some((factor) => {
    // 자기 자신은 제외
    if (excludeId && factor.id === excludeId) {
      return false;
    }

    // 이름 기반 중복 검사
    return areStringsEqual(factor.factor, factorName);
  });
}

// ==================== 편의 함수 ====================

/**
 * 모든 카테고리에서 제외할 대분류 ID 목록 생성
 *
 * @param categories - 카테고리 배열
 * @param currentCategoryId - 현재 선택 중인 카테고리 ID (제외)
 * @returns 제외할 categoryId 배열
 */
export function getExcludedCategoryIds(
  categories: CategoryBase[],
  currentCategoryId?: string
): number[] {
  return categories
    .filter((cat) => cat.id !== currentCategoryId)
    .map((cat) => cat.categoryId)
    .filter((id): id is number => id !== null);
}

/**
 * 특정 대분류에서 제외할 소분류 ID 목록 생성
 *
 * @param category - 대분류
 * @param currentSubcategoryId - 현재 선택 중인 소분류 ID (제외)
 * @returns 제외할 소분류 ID 배열
 */
export function getExcludedSubcategoryIds(
  category: CategoryBase,
  currentSubcategoryId?: number
): number[] {
  return category.subcategories
    .filter((sub) => sub.id !== currentSubcategoryId)
    .map((sub) => sub.id);
}
