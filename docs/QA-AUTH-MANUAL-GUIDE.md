# TongPass 인증 시스템 수동 테스트 가이드

## 1. 테스트 환경 설정

### 1.1 필수 도구
- 브라우저 (Chrome 권장)
- 터미널
- curl 또는 Postman
- jq (선택, JSON 포맷팅용)

### 1.2 환경 변수 확인
```bash
# .env.local 파일 위치
/home/remo/바탕화면/tong2026/tong-pass/apps/admin-web/.env.local

# 필요한 환경 변수
VITE_SUPABASE_URL=https://zbqittvnenjgoimlixpn.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 2. 빠른 API 테스트 방법

### 2.1 Shell 스크립트 사용 (권장)
```bash
# 스크립트 실행
SUPABASE_ANON_KEY='your-anon-key' ./scripts/test-auth-api.sh

# 메뉴에서 원하는 테스트 선택
# 6번 "전체 테스트 실행"으로 자동화된 테스트 수행
```

### 2.2 curl 직접 사용

#### SMS 발송 테스트
```bash
# 회원가입용 SMS 발송
curl -X POST \
  'https://zbqittvnenjgoimlixpn.supabase.co/functions/v1/send-sms' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"phone":"01012345678","purpose":"SIGNUP"}'

# 로그인용 SMS 발송
curl -X POST \
  'https://zbqittvnenjgoimlixpn.supabase.co/functions/v1/send-sms' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"phone":"01095106236","purpose":"LOGIN"}'
```

#### SMS 인증 확인
```bash
curl -X POST \
  'https://zbqittvnenjgoimlixpn.supabase.co/functions/v1/verify-sms' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"phone":"01012345678","code":"123456","purpose":"SIGNUP"}'
```

#### 로그인 테스트
```bash
curl -X POST \
  'https://zbqittvnenjgoimlixpn.supabase.co/functions/v1/login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"phone":"01095106236","password":"a123123@"}'
```

---

## 3. Supabase 대시보드 활용

### 3.1 접속 방법
1. https://supabase.com 로그인
2. 프로젝트 선택: `zbqittvnenjgoimlixpn`
3. 또는 직접: https://supabase.com/dashboard/project/zbqittvnenjgoimlixpn

### 3.2 Edge Functions 로그 확인
```
경로: Edge Functions > 함수 선택 > Logs
```
- `send-sms`: SMS 발송 로그
- `verify-sms`: 인증 확인 로그
- `login`: 로그인 로그
- `signup`: 회원가입 로그

### 3.3 SMS 인증번호 확인 (개발 환경)
```sql
-- SQL Editor에서 실행
SELECT phone, code, purpose, verified, attempts, expires_at, created_at
FROM sms_verifications
WHERE phone = '01012345678'
ORDER BY created_at DESC
LIMIT 5;
```

### 3.4 사용자 조회
```sql
-- 전화번호로 사용자 조회
SELECT id, name, phone, role, is_active, company_id, site_id
FROM users
WHERE phone = '01095106236';

-- 모든 관리자 조회
SELECT u.*, c.name as company_name
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.role IN ('SUPER_ADMIN', 'SITE_ADMIN');
```

### 3.5 테스트 데이터 정리
```sql
-- SMS 인증 기록 삭제 (테스트용 번호만)
DELETE FROM sms_verifications WHERE phone = '01000000001';

-- 테스트 사용자 삭제 주의!
-- 먼저 auth.users에서 삭제해야 함 (Supabase Auth 대시보드에서)
```

---

## 4. 브라우저 개발자 도구 활용

### 4.1 네트워크 탭 확인
```
Chrome DevTools > Network 탭
- XHR/Fetch 필터 적용
- send-sms, verify-sms, login 요청 확인
```

### 4.2 콘솔에서 인증코드 확인
```javascript
// 개발 환경에서 SMS 발송 시 콘솔에 출력됨
// [DEV] SMS 인증번호: 123456

// 또는 API 응답에서 직접 확인 (개발 환경만)
fetch('/functions/v1/send-sms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({ phone: '01012345678', purpose: 'SIGNUP' })
}).then(r => r.json()).then(console.log);
// { success: true, code: "123456", expiresIn: 180 }
```

### 4.3 Local Storage / Session Storage 확인
```
Chrome DevTools > Application > Storage
- supabase.auth.token: 로그인 세션 토큰
- onboarding-data: 회원가입 중간 데이터
```

---

## 5. 테스트 시나리오별 빠른 확인

### 5.1 로그인 테스트
| 시나리오 | 입력값 | 예상 결과 |
|---------|--------|----------|
| 정상 로그인 | 010-9510-6236 / a123123@ | 대시보드 이동 |
| 잘못된 비밀번호 | 010-9510-6236 / wrong | 에러 메시지 |
| 미등록 번호 | 010-0000-0000 / any | 에러 메시지 |

### 5.2 회원가입 테스트
1. `/onboarding/step1` 접속
2. 새 휴대폰 번호 입력
3. SMS 발송 -> 콘솔에서 인증번호 확인
4. 인증 완료 후 다음 단계 진행

### 5.3 SMS 인증 테스트
| 시나리오 | 확인 방법 |
|---------|----------|
| 인증번호 확인 | 콘솔 로그 또는 API 응답 |
| 만료 확인 | 3분 후 재시도 |
| 5회 초과 | 5번 틀린 코드 입력 |

---

## 6. 자주 발생하는 문제 해결

### 6.1 "CORS 에러"
```
원인: 로컬 개발 서버와 Supabase 간 CORS 문제
해결: Edge Function에 CORS 헤더 이미 설정됨
확인: 브라우저 확장 프로그램 충돌 여부
```

### 6.2 "인증 토큰 만료"
```
원인: 10분 이상 회원가입 진행
해결: Step1부터 다시 시작
확인: verificationToken의 expiresAt 확인
```

### 6.3 "이미 가입된 휴대폰"
```sql
-- 테스트 계정 확인
SELECT * FROM users WHERE phone = '01012345678';

-- 테스트 계정 삭제 (주의!)
-- 1. Supabase Auth 대시보드에서 사용자 삭제
-- 2. 그 후 users 테이블 레코드 삭제
```

### 6.4 SMS 미수신
```
확인 사항:
1. NCP 시크릿 설정 확인 (Supabase > Edge Functions > Secrets)
2. Edge Function 로그 확인
3. 발신 번호 등록 상태 확인 (NCP 콘솔)
4. 개발 환경에서는 콘솔 로그로 대체
```

---

## 7. 테스트 데이터 관리

### 7.1 테스트 계정 목록
| 번호 | 이름 | 역할 | 비밀번호 |
|-----|------|------|---------|
| 010-9510-6236 | 배은경 | SUPER_ADMIN | a123123@ |

### 7.2 테스트용 사업자번호
```
123-45-67890: 테스트용 (사용 가능 여부 먼저 확인)
```

### 7.3 테스트 후 정리
```sql
-- SMS 인증 기록 정리 (만료된 것만)
DELETE FROM sms_verifications
WHERE expires_at < NOW();

-- 특정 테스트 번호 기록 삭제
DELETE FROM sms_verifications
WHERE phone LIKE '0100000%';
```

---

## 8. 자동화 테스트 실행

### 8.1 API 테스트 (Vitest)
```bash
cd /home/remo/바탕화면/tong2026/tong-pass/apps/admin-web

# 테스트 실행
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
pnpm vitest run src/__tests__/auth.api.test.ts
```

### 8.2 E2E 테스트 (Playwright)
```bash
cd /home/remo/바탕화면/tong2026/tong-pass/apps/admin-web

# Playwright 설치
pnpm add -D @playwright/test
npx playwright install

# 테스트 실행
npx playwright test e2e/auth.spec.ts

# UI 모드로 실행
npx playwright test --ui
```

### 8.3 CI/CD 통합
```yaml
# .github/workflows/test.yml 예시
name: Auth Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: npx playwright test
```
