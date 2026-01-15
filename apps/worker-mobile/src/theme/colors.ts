/**
 * 산업현장통 모바일 앱 - 색상 시스템
 * Orange Gradient 테마 기반
 */

export const colors = {
  // Primary (Orange Gradient)
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },

  // Neutral (Slate)
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    800: '#1E293B',
  },

  // Gray
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
  },

  // Semantic
  semantic: {
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
  },

  // Input Field States (레퍼런스 기반)
  input: {
    default: {
      border: '#CBD5E1',      // slate-300
      placeholder: '#94A3B8', // slate-400
      text: '#1E293B',        // slate-800
      background: '#FFFFFF',
    },
    focused: {
      border: '#F97316',      // orange-500
      ring: '#FFEDD5',        // orange-100
      text: '#1E293B',
      background: '#FFFFFF',
    },
    filled: {
      border: '#CBD5E1',      // slate-300
      text: '#1E293B',        // slate-800
      background: '#FFFFFF',
    },
    disabled: {
      border: '#E2E8F0',      // slate-200
      background: '#F1F5F9',  // slate-100
      text: '#94A3B8',        // slate-400
      placeholder: '#94A3B8',
    },
    error: {
      border: '#DC2626',      // red-600
      text: '#1E293B',
      message: '#DC2626',
      background: '#FFFFFF',
    },
    success: {
      border: '#16A34A',      // green-600
      text: '#1E293B',
      icon: '#16A34A',
      background: '#FFFFFF',
    },
  },

  // Header
  header: {
    background: '#F97316',    // orange-500
    backgroundEnd: '#EA580C', // orange-600 (gradient)
    text: '#FFFFFF',
    icon: '#FFFFFF',
  },

  // Tab Bar
  tabBar: {
    background: '#FFFFFF',
    border: '#E5E7EB',        // gray-200
    active: '#F97316',        // orange-500
    inactive: '#94A3B8',      // slate-400
  },

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Type exports
export type Colors = typeof colors;
export type PrimaryColor = keyof typeof colors.primary;
export type InputState = keyof typeof colors.input;
