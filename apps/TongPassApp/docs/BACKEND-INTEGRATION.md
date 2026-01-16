# 통패스 근로자 앱 백엔드 연동 가이드

> 이 문서는 TongPassApp을 Supabase 백엔드와 연동하는 방법을 안내합니다.

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [Supabase 설정](#2-supabase-설정)
3. [Edge Functions 배포](#3-edge-functions-배포)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [로컬 개발](#5-로컬-개발)
6. [API 테스트](#6-api-테스트)
7. [트러블슈팅](#7-트러블슈팅)

---

## 1. 아키텍처 개요

### 1.1 시스템 구성

```
┌──────────────────────────────────────────────────────────┐
│                   TongPassApp (React Native)             │
│                   iOS / Android                          │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼ HTTPS
┌──────────────────────────────────────────────────────────┐
│              Supabase (Backend as a Service)             │
├──────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │  Edge Functions │  │  PostgreSQL    │  │    Auth    │ │
│  │  (Deno)        │  │  (Database)    │  │   (JWT)    │ │
│  └────────────────┘  └────────────────┘  └────────────┘ │
│  ┌────────────────┐  ┌────────────────┐                 │
│  │   Realtime     │  │    Storage     │                 │
│  │  (WebSocket)   │  │  (Files)       │                 │
│  └────────────────┘  └────────────────┘                 │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Edge Functions (API)

| Function | Method | 용도 | 상태 |
|----------|--------|------|:----:|
| `verify-company-code` | POST | 회사코드 검증 | ✅ |
| `send-sms` | POST | SMS 인증 발송 | ✅ |
| `verify-sms` | POST | SMS 인증 확인 | ✅ |
| `register-worker` | POST | 근로자 가입 | ✅ |
| `worker-me` | GET | 내 정보 조회 | ✅ |
| `check-in` | POST | 출근 (QR) | ✅ |
| `check-out` | POST | 퇴근 (QR) | ✅ |
| `login` | POST | 관리자 로그인 | ✅ |

### 1.3 데이터베이스 마이그레이션

| 파일 | 설명 | 상태 |
|------|------|:----:|
| `00001_create_tables.sql` | 기본 테이블 생성 | ✅ |
| `00002_rls_policies.sql` | RLS 정책 | ✅ |
| `00007_add_user_status.sql` | 사용자 상태 필드 | ✅ |
| `00009_company_codes.sql` | 회사코드 시스템 | ✅ |
| `00010_worker_registration_fields.sql` | 근로자 가입 필드 | ✅ |

---

## 2. Supabase 설정

### 2.1 Supabase CLI 설치

```bash
# macOS
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### 2.2 프로젝트 초기화

```bash
cd backend/supabase

# Supabase 로그인
supabase login

# 로컬 개발 환경 시작
supabase start

# 출력 예시:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 데이터베이스 마이그레이션

```bash
# 모든 마이그레이션 실행
supabase db reset

# 또는 프로덕션에 배포
supabase db push
```

### 2.4 시드 데이터 삽입

```bash
# 개발용 테스트 데이터 삽입
psql postgresql://postgres:postgres@localhost:54322/postgres < seed/seed.sql

# 또는 Supabase Studio에서 SQL 에디터로 실행
# http://localhost:54323
```

---

## 3. Edge Functions 배포

### 3.1 로컬 테스트

```bash
cd backend/supabase

# 특정 함수 로컬 실행
supabase functions serve verify-company-code --env-file .env.local

# 모든 함수 실행
supabase functions serve --env-file .env.local
```

### 3.2 함수 테스트

```bash
# verify-company-code 테스트
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/verify-company-code' \
  --header 'Content-Type: application/json' \
  --data '{"companyCode":"A1B2C3"}'

# register-worker 테스트
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/register-worker' \
  --header 'Content-Type: application/json' \
  --data '{
    "verificationToken": "DEV_TOKEN_01012345678",
    "phone": "01012345678",
    "name": "홍길동",
    "birthDate": "19900315",
    "gender": "M",
    "nationality": "KR",
    "jobTitle": "전기기사",
    "companyId": 1,
    "siteId": 1,
    "partnerId": 1,
    "termsAgreed": true,
    "privacyAgreed": true,
    "thirdPartyAgreed": true,
    "locationAgreed": true,
    "signatureImage": "data:image/png;base64,iVBOR..."
  }'
```

### 3.3 프로덕션 배포

```bash
# Supabase 프로젝트 연결
supabase link --project-ref your-project-id

# 모든 함수 배포
supabase functions deploy

# 개별 함수 배포
supabase functions deploy verify-company-code
supabase functions deploy register-worker
supabase functions deploy worker-me
```

---

## 4. 환경 변수 설정

### 4.1 백엔드 환경 변수

```bash
# backend/supabase/.env.local
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# QR 코드 서명 시크릿 키
QR_SECRET_KEY=your-secret-key-here

# SMS 발송 (네이버 클라우드 SENS)
NCP_ACCESS_KEY=your-ncp-access-key
NCP_SECRET_KEY=your-ncp-secret-key
NCP_SMS_SERVICE_ID=ncp:sms:kr:123456789:your-service
NCP_SMS_SEND_NUMBER=01012345678

# 환경 구분
ENVIRONMENT=development  # development | production
```

### 4.2 Supabase Dashboard 환경 변수 설정

프로덕션 배포 시 Supabase Dashboard에서 설정:

1. https://supabase.com/dashboard/project/{project-id}/settings/functions
2. Secrets 탭 클릭
3. 위 환경 변수 추가

### 4.3 앱 환경 변수

```bash
# apps/TongPassApp/.env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
QR_SECRET_KEY=your-secret-key-here
```

---

## 5. 로컬 개발

### 5.1 백엔드 시작

```bash
# Terminal 1: Supabase 로컬 환경 시작
cd backend/supabase
supabase start

# Terminal 2: Edge Functions 실행
supabase functions serve --env-file .env.local
```

### 5.2 앱 실행

```bash
# Terminal 3: React Native Metro 서버
cd apps/TongPassApp
yarn start

# Terminal 4: iOS 시뮬레이터 또는 Android 에뮬레이터
yarn ios
# 또는
yarn android
```

### 5.3 개발 워크플로우

1. **코드 수정**: Edge Function 또는 앱 코드 수정
2. **핫 리로드**:
   - Edge Functions: 자동 재시작 (supabase functions serve)
   - React Native: Fast Refresh 지원
3. **테스트**: curl 또는 앱에서 API 호출
4. **로그 확인**:
   - Edge Functions: Terminal 출력
   - Supabase Studio: Logs 탭

---

## 6. API 테스트

### 6.1 Postman Collection

```json
{
  "info": {
    "name": "TongPass Worker App API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Verify Company Code",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"companyCode\":\"A1B2C3\"}"
        },
        "url": {
          "raw": "{{base_url}}/functions/v1/verify-company-code"
        }
      }
    },
    {
      "name": "2. Send SMS",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"phone\":\"01012345678\",\"purpose\":\"SIGNUP\"}"
        },
        "url": {
          "raw": "{{base_url}}/functions/v1/send-sms"
        }
      }
    },
    {
      "name": "3. Verify SMS",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"phone\":\"01012345678\",\"code\":\"123456\",\"purpose\":\"SIGNUP\"}"
        },
        "url": {
          "raw": "{{base_url}}/functions/v1/verify-sms"
        }
      }
    },
    {
      "name": "4. Register Worker",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"verificationToken\":\"DEV_TOKEN_01012345678\",\"phone\":\"01012345678\",\"name\":\"홍길동\",\"birthDate\":\"19900315\",\"gender\":\"M\",\"nationality\":\"KR\",\"jobTitle\":\"전기기사\",\"companyId\":1,\"siteId\":1,\"partnerId\":1,\"termsAgreed\":true,\"privacyAgreed\":true,\"thirdPartyAgreed\":true,\"locationAgreed\":true,\"signatureImage\":\"data:image/png;base64,...\"}"
        },
        "url": {
          "raw": "{{base_url}}/functions/v1/register-worker"
        }
      }
    },
    {
      "name": "5. Worker Me",
      "request": {
        "method": "GET",
        "header": [
          {"key": "Authorization", "value": "Bearer {{access_token}}"}
        ],
        "url": {
          "raw": "{{base_url}}/functions/v1/worker-me"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:54321"
    },
    {
      "key": "access_token",
      "value": ""
    }
  ]
}
```

### 6.2 개발 모드 토큰

개발 환경에서는 `DEV_TOKEN_` 접두사로 SMS 인증을 우회할 수 있습니다:

```typescript
// verificationToken에 아래 값 사용
"DEV_TOKEN_01012345678"

// 실제 SMS 인증 없이 가입 가능
```

---

## 7. 트러블슈팅

### 7.1 일반적인 문제

#### 문제: Edge Function 배포 실패
```
Error: Function deployment failed
```

**해결 방법:**
```bash
# 1. Supabase CLI 업데이트
brew upgrade supabase

# 2. 프로젝트 재연결
supabase link --project-ref your-project-id

# 3. 개별 함수 배포 시도
supabase functions deploy verify-company-code --no-verify-jwt
```

#### 문제: CORS 에러
```
Access to fetch at 'https://xxx.supabase.co/functions/v1/verify-company-code'
from origin 'http://localhost:8081' has been blocked by CORS policy
```

**해결 방법:**
- Edge Function에서 CORS 헤더 설정 확인:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OPTIONS 요청 처리
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

#### 문제: 인증 토큰 만료
```
401 Unauthorized
```

**해결 방법:**
```typescript
// API 클라이언트에 토큰 갱신 로직 추가
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 7.2 데이터베이스 문제

#### 문제: 마이그레이션 순서 오류
```
ERROR: column "status" does not exist
```

**해결 방법:**
```bash
# 마이그레이션 초기화 후 재실행
supabase db reset

# 또는 특정 마이그레이션만 실행
psql $DATABASE_URL -f migrations/00007_add_user_status.sql
```

#### 문제: RLS 정책으로 데이터 접근 불가
```
new row violates row-level security policy
```

**해결 방법:**
```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Service Role 키 사용 (RLS 우회)
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // Anon Key 대신 Service Role Key
);
```

### 7.3 앱 연동 문제

#### 문제: 네트워크 요청 실패 (Android)
```
Network request failed
```

**해결 방법:**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application
  android:usesCleartextTraffic="true">  <!-- 로컬 개발용 -->
  ...
</application>
```

#### 문제: iOS에서 localhost 연결 안 됨
```
The resource could not be loaded because the App Transport Security policy
```

**해결 방법:**
```xml
<!-- ios/TongPassApp/Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>  <!-- 로컬 개발용만 -->
</dict>
```

---

## 8. 모니터링 및 로그

### 8.1 Supabase Dashboard

**로그 확인:**
1. https://supabase.com/dashboard/project/{project-id}/logs/edge-functions
2. Function 선택
3. 실시간 로그 및 에러 확인

**데이터베이스 쿼리:**
1. https://supabase.com/dashboard/project/{project-id}/editor
2. SQL Editor에서 쿼리 실행

### 8.2 로컬 개발 로그

```bash
# Edge Functions 로그
supabase functions serve --debug

# 데이터베이스 로그
supabase db inspect  # 테이블 확인
supabase db dump     # 전체 덤프
```

---

## 9. 보안 체크리스트

### 9.1 프로덕션 배포 전

- [ ] 환경 변수에 시크릿 키 설정 완료
- [ ] RLS 정책 활성화 확인
- [ ] CORS 헤더 적절히 제한 (`*` 대신 특정 도메인)
- [ ] Service Role Key는 서버에서만 사용
- [ ] QR 서명 검증 활성화 (QR_SECRET_KEY 설정)
- [ ] SMS 발송 횟수 제한 (Rate Limiting)
- [ ] 개발용 토큰 우회 비활성화

### 9.2 코드 리뷰 포인트

```typescript
// ❌ 나쁜 예: Service Role Key를 클라이언트에서 사용
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // 위험!
);

// ✅ 좋은 예: Anon Key 사용
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
```

---

## 10. 관련 문서

- [API 명세](./API.md)
- [기술 아키텍처](./ARCHITECTURE.md)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Edge Functions 가이드](https://supabase.com/docs/guides/functions)
- [회사코드 QR 가입 기획서](../../../docs/signin/회사코드_QR_가입_기획서.md)
