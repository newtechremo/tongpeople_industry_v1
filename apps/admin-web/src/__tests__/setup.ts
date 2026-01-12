/**
 * Vitest 테스트 셋업 파일
 */
import '@testing-library/jest-dom';

// Mock fetch for API tests
global.fetch = global.fetch || jest.fn();

// Mock environment variables
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zbqittvnenjgoimlixpn.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Suppress console.warn in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    // Supabase 환경 변수 경고 무시
    if (typeof args[0] === 'string' && args[0].includes('Supabase 환경 변수')) {
      return;
    }
    originalWarn.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
