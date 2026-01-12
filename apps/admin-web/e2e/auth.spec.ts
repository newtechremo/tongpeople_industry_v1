/**
 * 인증 E2E 테스트
 * Playwright 기반 브라우저 자동화 테스트
 *
 * 실행 방법:
 * 1. 개발 서버 실행: pnpm dev
 * 2. 테스트 실행: npx playwright test
 * 3. UI 모드: npx playwright test --ui
 */
import { test, expect } from '@playwright/test';

// 테스트 데이터
const TEST_PHONE = '010-9510-6236';
const TEST_PASSWORD = 'a123123@';
const WRONG_PASSWORD = 'wrongpassword';
const UNREGISTERED_PHONE = '010-0000-0000';

test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page.locator('h2')).toContainText('관리자 로그인');

    // 입력 필드 존재 확인
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // 로그인 버튼 존재 확인
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('휴대폰 번호 형식이 자동 포맷팅된다', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.fill('01012345678');

    // 010-1234-5678 형식으로 변환 확인
    await expect(phoneInput).toHaveValue('010-1234-5678');
  });

  test('비밀번호 표시/숨김 토글이 동작한다', async ({ page }) => {
    const passwordInput = page.locator('input#password');
    const toggleButton = page.locator('button[aria-label*="비밀번호"]');

    // 초기 상태: password 타입
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 토글 클릭 후: text 타입
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // 다시 토글: password 타입
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('잘못된 휴대폰 번호 형식으로 로그인 시도하면 에러가 표시된다', async ({ page }) => {
    await page.locator('input[type="tel"]').fill('0212345');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: '로그인' }).click();

    // 에러 메시지 확인
    await expect(page.locator('text=올바른 휴대폰 번호를 입력해주세요')).toBeVisible();
  });

  test('미등록 휴대폰 번호로 로그인 시도하면 에러가 표시된다', async ({ page }) => {
    await page.locator('input[type="tel"]').fill(UNREGISTERED_PHONE);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();

    // 에러 메시지 확인 (네트워크 요청 완료 대기)
    await expect(page.locator('text=등록되지 않은 휴대폰 번호입니다')).toBeVisible({ timeout: 10000 });
  });

  test('잘못된 비밀번호로 로그인 시도하면 에러가 표시된다', async ({ page }) => {
    await page.locator('input[type="tel"]').fill(TEST_PHONE);
    await page.locator('input[type="password"]').fill(WRONG_PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();

    // 에러 메시지 확인
    await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible({ timeout: 10000 });
  });

  test('정상 로그인 시 대시보드로 이동한다', async ({ page }) => {
    await page.locator('input[type="tel"]').fill(TEST_PHONE);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();

    // 대시보드 페이지로 이동 확인
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('회원가입 링크가 올바르게 동작한다', async ({ page }) => {
    await page.getByRole('link', { name: '신규 회원가입' }).click();
    await expect(page).toHaveURL('/onboarding/step1');
  });

  test('비밀번호 재설정 링크가 올바르게 동작한다', async ({ page }) => {
    await page.getByRole('link', { name: '비밀번호를 잊으셨나요?' }).click();
    await expect(page).toHaveURL('/password-reset');
  });
});

test.describe('회원가입 페이지 (Step 1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding/step1');
  });

  test('회원가입 1단계 페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('통패스 시작하기');
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();
  });

  test('필수 약관 미동의 시 다음 버튼이 비활성화된다', async ({ page }) => {
    await page.locator('input#name').fill('테스트');
    await page.locator('input#phone').fill('010-1234-5678');

    // 인증 완료 시뮬레이션 없이는 버튼 비활성화 상태
    const nextButton = page.getByRole('button', { name: '다음' });
    await expect(nextButton).toBeDisabled();
  });

  test('전체 동의 체크박스가 올바르게 동작한다', async ({ page }) => {
    // 전체 동의 체크
    await page.locator('text=전체 동의').click();

    // 개별 약관 모두 체크됨 확인
    const termsCheckbox = page.locator('text=[필수] 이용약관 동의').locator('xpath=ancestor::label');
    const privacyCheckbox = page.locator('text=[필수] 개인정보 처리방침 동의').locator('xpath=ancestor::label');
    const marketingCheckbox = page.locator('text=[선택] 마케팅 정보 수신 동의').locator('xpath=ancestor::label');

    // 체크 상태 확인 (체크박스 아이콘 존재 여부)
    await expect(termsCheckbox.locator('svg')).toBeVisible();
    await expect(privacyCheckbox.locator('svg')).toBeVisible();
    await expect(marketingCheckbox.locator('svg')).toBeVisible();
  });

  test('로그인 페이지로 이동 링크가 동작한다', async ({ page }) => {
    await page.getByRole('link', { name: '로그인' }).click();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('인증 상태 유지', () => {
  test('로그인 후 새로고침해도 세션이 유지된다', async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.locator('input[type="tel"]').fill(TEST_PHONE);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '로그인' }).click();

    // 대시보드 도착 확인
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 새로고침
    await page.reload();

    // 여전히 대시보드에 있음 (로그인 페이지로 리다이렉트 안됨)
    await expect(page).toHaveURL('/');
  });
});

test.describe('보호된 라우트', () => {
  test('로그인하지 않은 상태에서 대시보드 접근 시 로그인 페이지로 리다이렉트된다', async ({
    page,
  }) => {
    // 쿠키/스토리지 초기화
    await page.context().clearCookies();

    await page.goto('/');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/);
  });
});
