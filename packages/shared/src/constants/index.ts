/**
 * 산업현장통 - 공통 상수
 */

// ============================================
// 근무일 기준
// ============================================
/** 근무일 시작 시간 (04:00) - 당일 04:00 ~ 익일 03:59 */
export const WORK_DAY_START_HOUR = 4;

/** 기본 자동 퇴근 시간 (8시간) */
export const DEFAULT_AUTO_CHECKOUT_HOURS = 8;

// ============================================
// 고령자 기준
// ============================================
/** 고령자 기준 나이 (만 65세 이상) */
export const SENIOR_AGE_THRESHOLD = 65;

// ============================================
// QR 코드 설정
// ============================================
/** QR 코드 유효 시간 (초) - 캡처 방지용 */
export const QR_VALIDITY_SECONDS = 30;

/** QR 코드 갱신 주기 (초) */
export const QR_REFRESH_INTERVAL_SECONDS = 25;

// ============================================
// 퇴근 정책 라벨
// ============================================
export const CHECKOUT_POLICY_LABELS = {
  AUTO_8H: '자동 8시간',
  MANUAL: '수동 인증',
} as const;

// 역할 라벨은 types/index.ts에서 정의됨 (USER_ROLE_LABELS)

// ============================================
// 대시보드 차트 색상
// ============================================
export const CHART_COLORS = {
  navy: '#2E2E5D',      // 근로자
  orange: '#F97316',    // Primary
  brown: '#7D4E4E',     // 관리자
} as const;

// ============================================
// 테마 색상
// ============================================
export const THEME_COLORS = {
  primary: {
    start: '#F97316',   // orange-500
    end: '#EA580C',     // orange-600
    light: '#FFF7ED',   // orange-50
  },
  semantic: {
    success: '#16A34A', // green-600
    warning: '#D97706', // amber-600
    error: '#DC2626',   // red-600
    info: '#2563EB',    // blue-600
  },
} as const;
