# 통패스 프로젝트 작업 내역

> 마지막 업데이트: 2026-01-23

---

## 1. 프로젝트 개요

**통패스 (TongPass)** - QR 코드 기반 산업현장 출퇴근 관리 서비스

| 구성 요소 | 기술 스택 | 설명 |
|----------|----------|------|
| 관리자 웹 | React 19, Vite, Tailwind | 대시보드, 근로자 관리 |
| 근로자 앱 | React Native 0.74.6 | 출퇴근, QR 생성 |
| 백엔드 | Supabase Edge Functions (Deno) | API 서버 |

---

## 2. 완료된 작업

### 2.1 근로자 초대 기능 (invite-worker)

**작업 내용:**
- 관리자가 근로자를 선등록하고 SMS로 초대 링크 발송
- 네이버 클라우드 SENS API를 통한 실제 SMS 발송 구현

**수정 파일:**
- `backend/supabase/functions/invite-worker/index.ts`

**주요 변경:**
```typescript
// Unicode 지원 Base64 인코딩 (한글 이름 지원)
const inviteToken = btoa(encodeURIComponent(tokenPayload));

// SMS 발송 함수 추가
async function sendInviteSms(phone, message, serviceId, accessKey, secretKey, sendNumber)
```

**환경 변수 (Supabase Secrets):**
- `NCP_ACCESS_KEY` - 네이버 클라우드 Access Key
- `NCP_SECRET_KEY` - 네이버 클라우드 Secret Key
- `NCP_SMS_SERVICE_ID` - SENS 서비스 ID
- `NCP_SMS_SEND_NUMBER` - 발신번호

---

### 2.2 스키마 일관성 수정

**문제:**
- `/signup`은 `is_active` 필드만 사용
- `/invite-worker`, `/register-worker`는 `status` 필드 사용
- 불일치로 인한 로그인/상태 확인 오류

**수정 내용:**

| 파일 | 변경 |
|------|------|
| `signup/index.ts` | `status: 'ACTIVE'`, `exclude_from_list: true` 추가 |
| `login/index.ts` | `status`와 `is_active` 모두 체크 |
| `register-worker/index.ts` | `is_active: false` 추가 |

---

### 2.3 JWT 토큰 시스템 통일

**문제:**
- `login-worker`는 커스텀 JWT 토큰 생성 (`jwt.ts`)
- `worker-me` 등은 Supabase Auth의 `getUser(token)` 사용
- **토큰 시스템 불일치**로 "세션 만료" 에러 발생

**수정 내용:**
다음 함수들을 커스텀 JWT 검증으로 변경:

| 파일 | 변경 전 | 변경 후 |
|------|---------|---------|
| `worker-me/index.ts` | `supabaseAuth.auth.getUser(token)` | `verifyAccessToken(token)` |
| `worker-commute-in/index.ts` | 동일 | 동일 |
| `worker-commute-out/index.ts` | 동일 | 동일 |
| `worker-qr-payload/index.ts` | 동일 | 동일 |
| `worker-attendance-monthly/index.ts` | 동일 | 동일 |

**변경 패턴:**
```typescript
// Before
import { verifyAccessToken } from '../_shared/jwt.ts';

const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
if (authError || !user) { ... }
// user.id 사용

// After
const userId = await verifyAccessToken(token);
if (!userId) { ... }
// userId 사용
```

**상태:** 코드 수정 완료, **배포 필요**

---

### 2.4 토큰 갱신 URL 수정

**문제:**
- `client.ts`에서 `/auth/refresh` 호출
- 실제 엔드포인트는 `/auth-refresh`

**수정:**
```typescript
// apps/TongPassApp/src/api/client.ts (라인 188)
// Before
const response = await axios.post(`${API_BASE_URL}/auth/refresh`, ...);

// After
const response = await axios.post(`${API_BASE_URL}/auth-refresh`, ...);
```

---

### 2.5 관리자 웹 - 생년월일 형식 수정

**문제:**
- 관리자가 8자리 숫자 입력 (예: 19800101)
- 서버는 YYYY-MM-DD 형식 기대

**수정:**
```typescript
// apps/admin-web/src/components/workers/WorkerAddModal.tsx
const rawBirthDate = formData.birthDate.replace(/-/g, '');
const formattedBirthDate = `${rawBirthDate.slice(0, 4)}-${rawBirthDate.slice(4, 6)}-${rawBirthDate.slice(6, 8)}`;
```

---

### 2.6 비밀번호 설정 화면 구현

**작업 내용:**
- 회원가입 플로우에 비밀번호 설정 단계 추가
- 비밀번호 규칙: 8자 이상, 영문+숫자+특수문자

**구현 파일:**
- `apps/TongPassApp/src/screens/auth/PasswordSetupScreen.tsx`

**플로우 변경:**
```
Before: PhoneVerify → WorkerInfo → Terms → Signature
After:  PhoneVerify → PasswordSetup → WorkerInfo → Terms → Signature
```

**상태:** 화면 구현 완료, 네비게이션 연결 필요

---

## 3. 아키텍처 개요

### 3.1 인증 플로우

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ 앱 로그인    │────►│ login-worker │────►│ JWT 토큰 발급│
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ generateTokens│
                    │   (jwt.ts)    │
                    └──────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │ accessToken │          │refreshToken │
       │ (1시간 유효)  │          │ (30일 유효)  │
       └─────────────┘          └─────────────┘
```

### 3.2 토큰 갱신 플로우

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ API 호출 │────►│ 401 Unauthorized│───►│ auth-refresh│
└─────────┘     └──────────────┘     └─────────────┘
     ▲                                      │
     │              ┌───────────────────────┘
     │              ▼
     │       ┌──────────────┐
     └───────│ 새 accessToken│
             └──────────────┘
```

### 3.3 근로자 상태 전이

```
선등록 방식:  PENDING ──(동의)──► ACTIVE
직접가입:    REQUESTED ──(승인)──► ACTIVE
                      ──(반려)──► REJECTED
```

---

## 4. 주요 파일 위치

### 백엔드 (Supabase Edge Functions)
```
backend/supabase/functions/
├── _shared/
│   ├── jwt.ts           # JWT 생성/검증
│   ├── cors.ts          # CORS 헤더
│   └── response.ts      # 응답 헬퍼
├── login-worker/        # 로그인
├── register-worker/     # 회원가입
├── invite-worker/       # 초대 (선등록)
├── worker-me/           # 내 정보
├── worker-commute-in/   # 출근
├── worker-commute-out/  # 퇴근
├── worker-qr-payload/   # QR 데이터
├── auth-refresh/        # 토큰 갱신
└── verify-sms/          # SMS 인증
```

### 프론트엔드 (React Native)
```
apps/TongPassApp/src/
├── api/
│   ├── client.ts        # Axios 인스턴스, 토큰 갱신
│   ├── auth.ts          # 인증 API
│   └── worker.ts        # 근로자 API
├── screens/
│   ├── auth/            # 인증 플로우 (6개 화면)
│   └── main/            # 메인 화면
├── store/atoms/
│   ├── authAtom.ts      # 인증 상태 (AsyncStorage 연동)
│   └── userAtom.ts      # 사용자 정보
└── hooks/
    └── useAuth.ts       # 인증 훅
```

### 관리자 웹
```
apps/admin-web/src/
├── api/
│   └── workers.ts       # 근로자 API
├── components/
│   └── workers/
│       └── WorkerAddModal.tsx  # 근로자 추가 모달
└── pages/
    └── WorkersPage.tsx  # 근로자 관리 페이지
```

---

## 5. 환경 설정

### Supabase Secrets
```bash
# 필수
JWT_SECRET=<your-jwt-secret>

# SMS (네이버 클라우드 SENS)
NCP_ACCESS_KEY=<access-key>
NCP_SECRET_KEY=<secret-key>
NCP_SMS_SERVICE_ID=<service-id>
NCP_SMS_SEND_NUMBER=<발신번호>
```

### 앱 환경 변수 (.env)
```
BASEURL=https://zbqittvnenjgoimlixpn.supabase.co/functions/v1
SUPABASE_ANON_KEY=<anon-key>
```

---

## 6. 배포 체크리스트

### Edge Functions 배포 (수정된 함수들)
```bash
cd backend/supabase
npx supabase functions deploy worker-me --no-verify-jwt
npx supabase functions deploy worker-commute-in --no-verify-jwt
npx supabase functions deploy worker-commute-out --no-verify-jwt
npx supabase functions deploy worker-qr-payload --no-verify-jwt
npx supabase functions deploy worker-attendance-monthly --no-verify-jwt
```

### 앱 빌드
```bash
cd apps/TongPassApp/android
./gradlew assembleRelease
```

### ADB 설치 (버전 41 사용)
```bash
/home/remo/Android/Sdk/platform-tools/adb install -r app/build/outputs/apk/release/app-release.apk
```

---

## 7. 알려진 이슈

1. **ADB 버전 충돌**: 시스템 adb(39) vs SDK adb(41)
   - 해결: SDK adb 경로 사용

2. **디버그 빌드 연결 문제**: Metro 서버 연결 실패
   - 해결: 릴리즈 빌드 사용

3. **세션 만료 에러**: 토큰 검증 방식 불일치
   - 해결: 배포 필요 (위 체크리스트 참조)
