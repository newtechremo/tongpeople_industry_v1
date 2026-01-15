/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary (Orange Gradient)
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        // Input Field States
        input: {
          border: {
            default: '#CBD5E1',   // slate-300
            focused: '#F97316',   // orange-500
            disabled: '#E2E8F0',  // slate-200
            error: '#DC2626',     // red-600
            success: '#16A34A',   // green-600
          },
          bg: {
            default: '#FFFFFF',
            disabled: '#F1F5F9',  // slate-100
          },
          text: {
            default: '#1E293B',   // slate-800
            placeholder: '#94A3B8', // slate-400
            disabled: '#94A3B8',
            error: '#DC2626',
          },
          ring: '#FFEDD5',        // orange-100
        },
        // Header
        header: {
          DEFAULT: '#F97316',
          text: '#FFFFFF',
        },
        // Tab Bar
        tab: {
          active: '#F97316',
          inactive: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        pretendard: ['Pretendard'],
        'pretendard-regular': ['Pretendard-Regular'],
        'pretendard-medium': ['Pretendard-Medium'],
        'pretendard-semibold': ['Pretendard-SemiBold'],
        'pretendard-bold': ['Pretendard-Bold'],
      },
      // 컴포넌트 크기
      height: {
        'input': '52px',
        'button-sm': '40px',
        'button-md': '48px',
        'button-lg': '52px',
        'header': '56px',
        'tabbar': '49px',
      },
      // 라운딩
      borderRadius: {
        'input': '12px',
        'button': '12px',
        'card': '16px',
        'modal': '24px',
      },
    },
  },
  plugins: [],
};
