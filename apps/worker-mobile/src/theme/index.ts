/**
 * 산업현장통 모바일 앱 - 테마 시스템
 * 모든 디자인 토큰 통합 export
 */

export * from './colors';
export * from './typography';
export * from './spacing';

// 통합 테마 객체
import { colors } from './colors';
import { fontFamily, fontSize, lineHeight, fontWeight, textStyles } from './typography';
import { spacing, componentSpacing, componentSize, borderRadius } from './spacing';

export const theme = {
  colors,
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  textStyles,
  spacing,
  componentSpacing,
  componentSize,
  borderRadius,
} as const;

export type Theme = typeof theme;
