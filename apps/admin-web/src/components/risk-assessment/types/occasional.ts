/**
 * 수시 위험성평가 타입 정의
 *
 * 두 가지 위험성 산정 방식 지원:
 * - LEVEL: 상중하 (HIGH/MEDIUM/LOW)
 * - FREQUENCY_INTENSITY: 빈도강도 (1-4 x 1-5 = 1-20점)
 */

export type RiskMethod = 'LEVEL' | 'FREQUENCY_INTENSITY';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskGradeLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * 위험요인 공통 필드
 * - 조치일, 조치자, 조치확인자는 필수
 */
export interface RiskFactorBase {
  id: string;
  factor: string;
  improvement: string;
  workPeriodStart: string;
  workPeriodEnd: string;

  // 공통 조치 필드 (필수)
  actionDate: string;
  actionAssigneeIds: string[];
  actionConfirmerIds: string[];

  // 검토내용 (옵션, 문자열 배열)
  reviewComments?: string[];
}

/**
 * 상중하 방식 위험요인
 */
export interface RiskFactorLevel extends RiskFactorBase {
  level: RiskLevel | null;
}

/**
 * 빈도강도 방식 위험요인
 * - frequency: 1~4 (빈도)
 * - intensity: 1~5 (강도)
 * - riskScore: frequency * intensity (1~20)
 * - gradeLevel: 계산된 등급 (LOW/MEDIUM/HIGH)
 */
export interface RiskFactorFrequencyIntensity extends RiskFactorBase {
  frequency: number | null;   // 1-4
  intensity: number | null;   // 1-5
  riskScore: number | null;   // frequency * intensity
  gradeLevel: RiskGradeLevel | null;
}

/**
 * 위험요인 Union 타입
 */
export type OccasionalRiskFactor = RiskFactorLevel | RiskFactorFrequencyIntensity;

/**
 * 하위 분류
 */
export interface OccasionalSubcategory {
  id: number;
  name: string;
  isCustom?: boolean;
  riskFactors: OccasionalRiskFactor[];
}

/**
 * 공종 (Category)
 */
export interface OccasionalCategory {
  id: string;
  categoryId: number | null;
  categoryName: string;
  subcategories: OccasionalSubcategory[];
}

/**
 * 수시 위험성평가 Payload
 */
export interface OccasionalAssessmentPayload {
  siteName: string;
  companyName: string;
  teamId: string;
  approvalLineId: string | null;
  workPeriodStart: string;
  workPeriodEnd: string;

  // 수시 평가 특화 필드
  triggerReason: string;      // 수시 평가 사유
  triggerDate: string;         // 수시 평가 발생일
  riskMethod: RiskMethod;      // 위험성 산정 방식

  categories: OccasionalCategory[];
}

/**
 * 타입 가드: LEVEL 방식 체크
 */
export function isRiskFactorLevel(factor: OccasionalRiskFactor): factor is RiskFactorLevel {
  return 'level' in factor;
}

/**
 * 타입 가드: FREQUENCY_INTENSITY 방식 체크
 */
export function isRiskFactorFrequencyIntensity(
  factor: OccasionalRiskFactor
): factor is RiskFactorFrequencyIntensity {
  return 'frequency' in factor && 'intensity' in factor;
}
