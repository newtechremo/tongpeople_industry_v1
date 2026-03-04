/**
 * 위험성평가 공통 타입 정의
 *
 * 수시/최초/정기 위험성평가에서 공통으로 사용하는 Base 타입
 */

// ==================== 공통 상수 타입 ====================

/**
 * 위험성 산정 방식
 */
export type RiskMethod = 'LEVEL' | 'FREQUENCY_INTENSITY';

/**
 * 위험성 수준 (상중하)
 */
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * 위험성 등급 (빈도강도)
 */
export type RiskGradeLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// ==================== Base 타입 ====================

/**
 * 위험요인 Base
 *
 * 모든 위험요인이 공통으로 가지는 필드
 */
export interface RiskFactorBase {
  id: string;
  factor: string;
  improvement: string;
  workPeriodStart: string;
  workPeriodEnd: string;
}

/**
 * 상중하 방식 위험요인
 */
export interface RiskFactorLevel extends RiskFactorBase {
  level: RiskLevel | null;
}

/**
 * 빈도강도 방식 위험요인 (개선 전/후)
 */
export interface RiskFactorFrequencyIntensity extends RiskFactorBase {
  // 개선 전 평가
  beforeFrequency: number | null;   // 1-4
  beforeIntensity: number | null;   // 1-5
  beforeRiskScore: number | null;   // beforeFrequency * beforeIntensity
  beforeGradeLevel: RiskGradeLevel | null;

  // 개선 후 평가
  afterFrequency: number | null;    // 1-4
  afterIntensity: number | null;    // 1-5
  afterRiskScore: number | null;    // afterFrequency * afterIntensity
  afterGradeLevel: RiskGradeLevel | null;
}

/**
 * 위험요인 Union 타입
 */
export type RiskFactor = RiskFactorLevel | RiskFactorFrequencyIntensity;

/**
 * 소분류 Base
 *
 * 모든 소분류가 공통으로 가지는 필드
 */
export interface SubcategoryBase {
  id: number;
  name: string;
  isCustom?: boolean;
  riskFactors: RiskFactor[];
}

/**
 * 대분류 Base
 *
 * 모든 대분류가 공통으로 가지는 필드
 */
export interface CategoryBase {
  id: string;
  categoryId: number | null;
  categoryName: string;
  subcategories: SubcategoryBase[];
}

/**
 * 위험성평가 Payload Base
 *
 * 모든 위험성평가가 공통으로 가지는 필드
 */
export interface AssessmentPayloadBase {
  siteName: string;
  companyName: string;
  approvalLineId: string | null;
  workPeriodStart: string;
  workPeriodEnd: string;
  riskMethod: RiskMethod;
  categories: CategoryBase[];
}

// ==================== 타입 가드 ====================

/**
 * LEVEL 방식 체크
 */
export function isRiskFactorLevel(factor: RiskFactor): factor is RiskFactorLevel {
  return 'level' in factor;
}

/**
 * FREQUENCY_INTENSITY 방식 체크
 */
export function isRiskFactorFrequencyIntensity(
  factor: RiskFactor
): factor is RiskFactorFrequencyIntensity {
  return 'beforeFrequency' in factor && 'beforeIntensity' in factor;
}

// ==================== 유틸리티 타입 ====================

/**
 * ID 생성을 위한 카운터
 */
let idCounter = 0;

/**
 * 고유 ID 생성
 */
export function generateId(): string {
  return `temp-${Date.now()}-${++idCounter}`;
}

/**
 * 날짜 포맷 (YYYY-MM-DD)
 */
export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 월 추가
 */
export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}
