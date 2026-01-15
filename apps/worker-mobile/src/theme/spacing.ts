/**
 * 산업현장통 모바일 앱 - 간격 시스템
 * 4px 기본 단위 기반
 */

export const spacing = {
  0: 0,
  1: 4,   // xs
  2: 8,   // sm
  3: 12,
  4: 16,  // md (기본)
  5: 20,
  6: 24,  // lg
  8: 32,  // xl
  10: 40,
  12: 48, // 2xl
  14: 56,
  16: 64,
} as const;

// 컴포넌트별 간격 프리셋
export const componentSpacing = {
  // 화면 패딩
  screenPadding: spacing[4],      // 16px

  // 섹션 간격
  sectionGap: spacing[6],         // 24px

  // 카드 내부 패딩
  cardPadding: spacing[5],        // 20px

  // 카드 간 간격
  cardGap: spacing[4],            // 16px

  // 입력 필드 간 간격
  inputGap: spacing[4],           // 16px

  // 라벨과 입력 간 간격
  labelGap: spacing[2],           // 8px

  // 아이콘과 텍스트 간격
  iconTextGap: spacing[2],        // 8px

  // 버튼 내부 패딩
  buttonPaddingX: spacing[5],     // 20px
  buttonPaddingY: spacing[3],     // 12px
} as const;

// 컴포넌트 크기
export const componentSize = {
  // 버튼 높이
  buttonHeight: {
    sm: 40,
    md: 48,
    lg: 52,
  },

  // 입력 필드 높이
  inputHeight: 52,

  // 헤더 높이
  headerHeight: 56,

  // 탭바 높이 (SafeArea 제외)
  tabBarHeight: 49,

  // 아이콘 크기
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  // 체크박스/라디오 크기
  checkbox: 24,
  radio: 24,
} as const;

// 라운딩
export const borderRadius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,  // 기본
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// Type exports
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
