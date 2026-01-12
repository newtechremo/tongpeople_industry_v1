/**
 * 인증 API 테스트
 * Edge Functions API 레벨 테스트
 *
 * 실행 방법:
 * 1. Vitest 설치 후: pnpm test
 * 2. 또는 직접 실행: npx tsx src/__tests__/auth.api.test.ts
 */

// 테스트 환경 설정
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zbqittvnenjgoimlixpn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// 헬퍼 함수
async function callEdgeFunction(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ status: number; data: Record<string, unknown> }> {
  const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { status: response.status, data };
}

// 테스트 데이터
const TEST_PHONE = '01000000001'; // 테스트용 가짜 번호
const EXISTING_PHONE = '01095106236'; // 실제 등록된 번호
const TEST_PASSWORD = 'Test1234!';

// ============================================
// SMS 인증 테스트
// ============================================
async function testSendSms() {
  console.log('\n=== SMS 발송 테스트 ===');

  // TC-SMS-001: 회원가입용 SMS 발송 (미등록 번호)
  console.log('\n[TC-SMS-001] 미등록 번호로 SMS 발송 (SIGNUP)');
  const result1 = await callEdgeFunction('send-sms', {
    phone: TEST_PHONE,
    purpose: 'SIGNUP',
  });
  console.log(`Status: ${result1.status}`);
  console.log(`Response:`, result1.data);

  // TC-SMS-002: 로그인용 SMS 발송 (등록된 번호)
  console.log('\n[TC-SMS-002] 등록된 번호로 SMS 발송 (LOGIN)');
  const result2 = await callEdgeFunction('send-sms', {
    phone: EXISTING_PHONE,
    purpose: 'LOGIN',
  });
  console.log(`Status: ${result2.status}`);
  console.log(`Response:`, result2.data);

  // TC-SMS-003: 회원가입용 SMS 발송 (이미 등록된 번호) - 에러 예상
  console.log('\n[TC-SMS-003] 이미 등록된 번호로 SIGNUP 요청 (에러 예상)');
  const result3 = await callEdgeFunction('send-sms', {
    phone: EXISTING_PHONE,
    purpose: 'SIGNUP',
  });
  console.log(`Status: ${result3.status} (expected: 400)`);
  console.log(`Response:`, result3.data);

  // TC-SMS-004: 잘못된 전화번호 형식
  console.log('\n[TC-SMS-004] 잘못된 전화번호 형식 (에러 예상)');
  const result4 = await callEdgeFunction('send-sms', {
    phone: '02123456',
    purpose: 'SIGNUP',
  });
  console.log(`Status: ${result4.status} (expected: 400)`);
  console.log(`Response:`, result4.data);
}

// ============================================
// SMS 인증 확인 테스트
// ============================================
async function testVerifySms() {
  console.log('\n=== SMS 인증 확인 테스트 ===');

  // TC-VERIFY-001: 잘못된 인증코드
  console.log('\n[TC-VERIFY-001] 잘못된 인증코드');
  const result1 = await callEdgeFunction('verify-sms', {
    phone: TEST_PHONE,
    code: '000000',
    purpose: 'SIGNUP',
  });
  console.log(`Status: ${result1.status} (expected: 400 or 404)`);
  console.log(`Response:`, result1.data);
}

// ============================================
// 로그인 테스트
// ============================================
async function testLogin() {
  console.log('\n=== 로그인 테스트 ===');

  // TC-LOGIN-001: 정상 로그인
  console.log('\n[TC-LOGIN-001] 정상 로그인');
  const result1 = await callEdgeFunction('login', {
    phone: EXISTING_PHONE,
    password: 'a123123@',
  });
  console.log(`Status: ${result1.status}`);
  console.log(`Success: ${result1.data.success}`);
  if (result1.data.data) {
    const data = result1.data.data as Record<string, unknown>;
    console.log(`User: ${JSON.stringify(data.user)}`);
    console.log(`Company: ${JSON.stringify(data.company)}`);
    console.log(`Has session: ${!!data.session}`);
  }

  // TC-LOGIN-002: 잘못된 비밀번호
  console.log('\n[TC-LOGIN-002] 잘못된 비밀번호');
  const result2 = await callEdgeFunction('login', {
    phone: EXISTING_PHONE,
    password: 'wrongpassword',
  });
  console.log(`Status: ${result2.status} (expected: 401)`);
  console.log(`Response:`, result2.data);

  // TC-LOGIN-003: 미등록 휴대폰 번호
  console.log('\n[TC-LOGIN-003] 미등록 휴대폰 번호');
  const result3 = await callEdgeFunction('login', {
    phone: TEST_PHONE,
    password: TEST_PASSWORD,
  });
  console.log(`Status: ${result3.status} (expected: 401)`);
  console.log(`Response:`, result3.data);
}

// ============================================
// 메인 실행
// ============================================
async function runAllTests() {
  console.log('========================================');
  console.log('TongPass 인증 API 테스트');
  console.log('========================================');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Anon Key: ${SUPABASE_ANON_KEY ? 'Set' : 'NOT SET'}`);

  if (!SUPABASE_ANON_KEY) {
    console.error('\n[ERROR] VITE_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.');
    console.log('다음 명령어로 실행하세요:');
    console.log('VITE_SUPABASE_ANON_KEY="your-key" npx tsx src/__tests__/auth.api.test.ts');
    process.exit(1);
  }

  try {
    await testSendSms();
    await testVerifySms();
    await testLogin();

    console.log('\n========================================');
    console.log('모든 테스트 완료');
    console.log('========================================');
  } catch (error) {
    console.error('\n[ERROR] 테스트 실행 중 오류:', error);
    process.exit(1);
  }
}

// Node.js 환경에서 직접 실행
if (typeof process !== 'undefined' && process.argv[1]?.includes('auth.api.test')) {
  runAllTests();
}

// Vitest용 export
export { testSendSms, testVerifySms, testLogin, runAllTests };
