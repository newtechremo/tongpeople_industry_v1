/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',  // Primary
          600: '#EA580C',  // Primary Dark
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        chart: {
          navy: '#2E2E5D',
          orange: '#F97316',
          brown: '#7D4E4E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      },
      zIndex: {
        '60': '60',
        '100': '100',
      },
    },
  },
  plugins: [],
};
