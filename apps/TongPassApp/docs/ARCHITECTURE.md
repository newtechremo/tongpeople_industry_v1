# 통패스 근로자 앱 기술 아키텍처

> **문서 범례**: ✅ 구현 완료 | 🚧 진행 중 | ⏳ 미구현

## 구현 현황 요약

| 영역 | 상태 | 설명 |
|------|:----:|------|
| **프로젝트 구조** | ✅ | 디렉토리 구조, 설정 파일 |
| **네비게이션** | ✅ | React Navigation 스택 구조 |
| **상태 관리** | ✅ | Recoil Atoms 정의 |
| **타입 정의** | ✅ | TypeScript 인터페이스 |
| **인증 플로우 UI** | ✅ | 6개 화면 구현 |
| **메인 화면 UI** | ✅ | 홈 화면 구현 |
| **API 클라이언트** | ✅ | Axios 설정, 토큰 갱신 |
| **API 연동** | ✅ | Supabase Edge Functions |
| **푸시 알림** | ⏳ | FCM 연동 |

---

## 1. 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트                               │
├─────────────────────────────┬───────────────────────────────────┤
│     관리자 웹 (admin-web)     │    근로자 앱 (TongPassApp)         │
│     React + Vite            │    React Native 0.74              │
│     localhost:5173          │    iOS / Android                  │
└─────────────────────────────┴───────────────────────────────────┘
                              │
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (Backend as a Service)              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Edge Functions     │  │        PostgreSQL                │ │
│  │  (Deno Runtime)     │  │  - companies, sites, partners    │ │
│  ├─────────────────────┤  │  - users, attendance             │ │
│  │ verify-company-code │  │  - company_codes                 │ │
│  │ send-sms / verify   │  │  - sms_verifications             │ │
│  │ register-worker     │  │                                  │ │
│  │ worker-me           │  │  RLS Policies 활성화              │ │
│  │ check-in/out        │  └──────────────────────────────────┘ │
│  └─────────────────────┘                                        │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │   Auth (JWT)        │  │        Storage                   │ │
│  │  - 토큰 발급/검증    │  │  - 전자서명 이미지                │ │
│  │  - 자동 갱신         │  │  - 프로필 사진 (추후)             │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Realtime (WebSocket)                      │  │
│  │  - 가입 승인 알림 (웹→앱)                                  │  │
│  │  - 출퇴근 기록 실시간 업데이트 (앱→웹)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     외부 서비스                                  │
├─────────────────────────────────────────────────────────────────┤
│  네이버 클라우드 SENS API (SMS 발송)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 기술 스택

### 2.1 코어 프레임워크

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | React Native | 0.74.6 | 크로스플랫폼 앱 |
| UI 라이브러리 | React | 18.2.0 | 컴포넌트 기반 UI |
| 언어 | TypeScript | 5.0.4 | 타입 안정성 |

### 2.2 네비게이션

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 네비게이션 | @react-navigation/native | 6.1.9 | 화면 전환 |
| 스택 | @react-navigation/native-stack | 6.9.17 | 스택 네비게이터 |

### 2.3 상태 관리

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 전역 상태 | Recoil | 0.7.7 | 앱 상태 관리 |
| 로컬 저장소 | AsyncStorage | 1.23.0 | 토큰/설정 영속화 |

### 2.4 API 통신

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| HTTP 클라이언트 | Axios | 1.6.2 | REST API 호출 |
| 환경 변수 | react-native-dotenv | - | .env 파일 관리 |

### 2.5 UI 컴포넌트

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 제스처 | react-native-gesture-handler | 2.16.0 | 터치 제스처 |
| 애니메이션 | react-native-reanimated | 3.8.1 | 부드러운 애니메이션 |
| 바텀시트 | @gorhom/bottom-sheet | 4.6.0 | 모달/시트 UI |
| QR 코드 | react-native-qrcode-svg | 6.3.2 | QR 생성 |
| SVG | react-native-svg | 15.2.0 | 벡터 그래픽 |
| 서명 | react-native-signature-canvas | 4.7.2 | 전자서명 |
| 토스트 | react-native-toast-message | 2.2.0 | 알림 메시지 |

### 2.6 유틸리티

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 날짜 | moment | 2.30.1 | 날짜 처리 |
| 타임존 | moment-timezone | 0.5.45 | 타임존 처리 |

---

## 3. 디렉토리 구조

```
TongPassApp/
├── src/
│   ├── api/                      # API 통신
│   │   ├── client.ts             # ✅ Axios 클라이언트 (토큰 갱신)
│   │   ├── auth.ts               # ✅ 인증 API
│   │   ├── worker.ts             # ✅ 근로자 API
│   │   └── index.ts
│   │
│   ├── screens/                  # 화면 컴포넌트
│   │   ├── auth/                 # ✅ 인증 플로우
│   │   │   ├── CompanyCodeScreen.tsx
│   │   │   ├── PhoneVerifyScreen.tsx
│   │   │   ├── WorkerInfoScreen.tsx
│   │   │   ├── TermsScreen.tsx
│   │   │   ├── SignatureScreen.tsx
│   │   │   ├── WaitingScreen.tsx
│   │   │   └── index.ts
│   │   └── main/                 # ✅ 메인 화면
│   │       ├── HomeScreen.tsx
│   │       └── index.ts
│   │
│   ├── navigation/               # ✅ 네비게이션
│   │   ├── RootNavigator.tsx     # 루트 네비게이터
│   │   ├── AuthStack.tsx         # 인증 스택
│   │   ├── MainStack.tsx         # 메인 스택
│   │   └── index.ts
│   │
│   ├── store/                    # ✅ 상태 관리 (Recoil)
│   │   └── atoms/
│   │       ├── authAtom.ts       # 인증 상태
│   │       ├── userAtom.ts       # 사용자 정보
│   │       ├── companyAtom.ts    # 회사/현장/팀
│   │       └── index.ts
│   │
│   ├── types/                    # ✅ 타입 정의
│   │   ├── user.ts               # 사용자 타입
│   │   ├── company.ts            # 회사 타입
│   │   ├── navigation.ts         # 네비게이션 타입
│   │   └── index.ts
│   │
│   ├── constants/                # ✅ 상수 정의
│   │   ├── colors.ts             # 색상 팔레트
│   │   ├── config.ts             # 설정값
│   │   └── index.ts
│   │
│   └── utils/                    # ✅ 유틸리티
│       ├── storage.ts            # AsyncStorage
│       ├── validators.ts         # 유효성 검사
│       ├── format.ts             # 포맷팅
│       └── index.ts
│
├── ios/                          # iOS 네이티브
├── android/                      # Android 네이티브
├── __tests__/                    # 테스트
│
├── App.tsx                       # ✅ 루트 컴포넌트
├── index.js                      # 앱 진입점
├── package.json                  # 의존성
├── tsconfig.json                 # TypeScript 설정
├── babel.config.js               # Babel 설정
└── metro.config.js               # Metro 설정
```

---

## 4. 네비게이션 구조

### 4.1 전체 플로우

```
                    ┌─────────────────┐
                    │ RootNavigator   │
                    │ (상태 기반 분기)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   AuthStack   │   │   Waiting     │   │   MainStack   │
│   (미로그인)   │   │   (승인대기)   │   │   (활성)      │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 4.2 AuthStack (인증 플로우)

```
CompanyCode → PhoneVerify → WorkerInfo → Terms → Signature → Waiting
```

```typescript
type AuthStackParamList = {
  CompanyCode: undefined;
  PhoneVerify: { companyId: string; siteId: string };
  WorkerInfo: {
    companyId: string;
    siteId: string;
    phoneNumber: string;
    preRegisteredData?: PreRegisteredData;
  };
  Terms: { workerId: string };
  Signature: { workerId: string };
  Waiting: undefined;
};
```

### 4.3 MainStack (메인 화면)

```typescript
type MainStackParamList = {
  Home: undefined;
  // 향후 추가 예정
  // Profile: undefined;
  // History: undefined;
};
```

### 4.4 상태 기반 라우팅 로직

```typescript
// RootNavigator.tsx
function RootNavigator() {
  const { isLoggedIn } = useRecoilValue(authState);
  const workerStatus = useRecoilValue(workerStatusState);

  if (!isLoggedIn) {
    return <AuthStack />;
  }

  if (workerStatus === 'REQUESTED') {
    return <WaitingScreen />;
  }

  if (workerStatus === 'ACTIVE') {
    return <MainStack />;
  }

  return <AuthStack />;
}
```

---

## 5. 상태 관리 (Recoil)

### 5.1 Atoms 구조

```
store/atoms/
├── authAtom.ts      # 인증 토큰, 로그인 상태
├── userAtom.ts      # 사용자 정보, 출퇴근 상태
├── companyAtom.ts   # 회사, 현장, 팀 정보
└── index.ts
```

### 5.2 authAtom

```typescript
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
}

const authState = atom<AuthState>({
  key: 'authState',
  default: {
    accessToken: null,
    refreshToken: null,
    isLoggedIn: false,
  },
  effects: [localStorageEffect('auth')],  // AsyncStorage 영속화
});
```

### 5.3 userAtom

```typescript
// 사용자 정보
const userInfoState = atom<Worker | null>({
  key: 'userInfoState',
  default: null,
});

// 근로자 상태
const workerStatusState = atom<WorkerStatus>({
  key: 'workerStatusState',
  default: 'PENDING',
});

// 출퇴근 상태
const commuteStatusState = atom<CommuteStatus>({
  key: 'commuteStatusState',
  default: 'WORK_OFF',
});
```

### 5.4 companyAtom

```typescript
const selectedCompanyState = atom<Company | null>({
  key: 'selectedCompanyState',
  default: null,
});

const selectedSiteState = atom<Site | null>({
  key: 'selectedSiteState',
  default: null,
});

const teamsState = atom<Team[]>({
  key: 'teamsState',
  default: [],
});
```

---

## 6. API 클라이언트

### 6.1 Axios 설정

```typescript
// api/client.ts
import axios from 'axios';
import { API_BASE_URL } from '@env';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 6.2 요청 인터셉터

```typescript
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getStorageData<string>('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### 6.3 응답 인터셉터 (토큰 갱신)

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 토큰 갱신 로직
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);
```

---

## 7. 색상 시스템

### 7.1 브랜드 컬러

```typescript
// constants/colors.ts
export const colors = {
  // Primary (오렌지 그라데이션)
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FFF7ED',

  // 텍스트
  textPrimary: '#1E293B',    // slate-800
  textSecondary: '#64748B',  // slate-500
  textDisabled: '#94A3B8',   // slate-400

  // 배경
  background: '#FFFFFF',
  backgroundGray: '#F8FAFC',

  // 상태
  success: '#22C55E',        // green-500
  error: '#EF4444',          // red-500
  warning: '#F59E0B',        // amber-500
  info: '#3B82F6',           // blue-500

  // 테두리
  border: '#E2E8F0',         // slate-200
  borderFocus: '#F97316',

  // 버튼
  buttonDisabled: '#CBD5E1',
};
```

### 7.2 출퇴근 버튼 색상

| 상태 | 배경색 | 텍스트 |
|------|--------|--------|
| WORK_OFF (출근하기) | `#3B82F6` (blue) | 흰색 |
| WORK_ON (퇴근하기) | `#EF4444` (red) | 흰색 |
| WORK_DONE (퇴근완료) | `#94A3B8` (gray) | 흰색 |

---

## 8. 데이터 흐름

### 8.1 회원가입 플로우

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 앱 (Client)  │    │   백엔드    │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │  회사코드 검증     │                  │
       │ ─────────────────>│                  │
       │                  │  회사 조회         │
       │                  │ ─────────────────>│
       │  회사/현장 정보    │                  │
       │ <─────────────────│                  │
       │                  │                  │
       │  SMS 인증 요청     │                  │
       │ ─────────────────>│                  │
       │                  │  SMS 전송         │
       │                  │ ═══════════════>  │
       │  인증번호 확인     │                  │
       │ ─────────────────>│                  │
       │                  │                  │
       │  근로자 등록       │                  │
       │ ─────────────────>│                  │
       │                  │  Worker 생성      │
       │                  │ ─────────────────>│
       │  토큰 발급        │                  │
       │ <─────────────────│                  │
```

### 8.2 출퇴근 플로우

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 앱 (Client)  │    │   백엔드    │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │  출근 요청         │                  │
       │ ─────────────────>│                  │
       │                  │  출근 기록 생성    │
       │                  │ ─────────────────>│
       │  출근 완료        │                  │
       │ <─────────────────│                  │
       │                  │                  │
       │  Recoil 상태 업데이트                 │
       │  WORK_OFF → WORK_ON                  │
```

---

## 9. 설정 파일

### 9.1 TypeScript (tsconfig.json)

```json
{
  "extends": "@tsconfig/react-native/tsconfig.json",
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    },
    "strict": true
  }
}
```

### 9.2 Babel (babel.config.js)

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv'],
    ['module-resolver', {
      root: ['./src'],
      alias: { '@': './src' }
    }],
    'react-native-reanimated/plugin',
  ],
};
```

### 9.3 환경 변수 (.env)

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# QR 코드 서명 (클라이언트)
QR_SECRET_KEY=your-secret-key-here
```

---

## 10. Edge Functions (Supabase)

### 10.1 구현된 함수

| Function | Endpoint | 인증 필요 | 설명 |
|----------|----------|:--------:|------|
| `verify-company-code` | POST /functions/v1/verify-company-code | ❌ | 회사코드 검증 + 현장/팀 목록 |
| `send-sms` | POST /functions/v1/send-sms | ❌ | SMS 인증번호 발송 |
| `verify-sms` | POST /functions/v1/verify-sms | ❌ | SMS 인증 확인 |
| `register-worker` | POST /functions/v1/register-worker | ❌ | 근로자 가입 (REQUESTED) |
| `worker-me` | GET /functions/v1/worker-me | ✅ | 내 정보 조회 |
| `check-in` | POST /functions/v1/check-in | ❌ | QR 출근 (서명 검증) |
| `check-out` | POST /functions/v1/check-out | ❌ | QR 퇴근 (서명 검증) |
| `login` | POST /functions/v1/login | ❌ | 관리자 로그인 |

### 10.2 함수 위치

```
backend/supabase/functions/
├── verify-company-code/
│   └── index.ts
├── send-sms/
│   └── index.ts
├── verify-sms/
│   └── index.ts
├── register-worker/
│   └── index.ts
├── worker-me/
│   └── index.ts
├── check-in/
│   └── index.ts
├── check-out/
│   └── index.ts
└── login/
    └── index.ts
```

### 10.3 보안 기능

**QR 코드 서명 검증**
```typescript
// 클라이언트 (앱)
const signature = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  message + QR_SECRET_KEY
);

// 서버 (Edge Function)
const isValid = await verifyQRSignature(qr_payload);
// → 30초 유효, HMAC-SHA256 서명 검증
```

**JWT 인증**
```typescript
// Authorization 헤더 자동 추가
apiClient.interceptors.request.use(async (config) => {
  const token = await getStorageData<string>('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**토큰 자동 갱신**
```typescript
// 401 에러 시 자동 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      const newToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 11. 향후 개발 계획

### 10.1 Phase 1 완료 항목

| 기능 | 상태 |
|------|:----:|
| 인증 플로우 UI | ✅ |
| 네비게이션 구조 | ✅ |
| 상태 관리 설정 | ✅ |
| 타입 정의 | ✅ |
| API 클라이언트 | ✅ |

### 10.2 Phase 2

| 기능 | 우선순위 | 상태 | 설명 |
|------|:--------:|:----:|------|
| API 연동 | 높음 | ✅ | Supabase Edge Functions 연동 완료 |
| 푸시 알림 | 높음 | ⏳ | FCM 연동 |
| 출퇴근 기록 조회 | 중간 | ⏳ | 히스토리 화면 |
| 프로필 수정 | 중간 | ⏳ | 정보 변경 |
| 오프라인 모드 | 낮음 | ⏳ | 네트워크 없을 때 처리 |

---

## 11. 관련 문서

- [프로젝트 개요](./PROJECT-OVERVIEW.md)
- [API 명세](./API.md)
- [백엔드 연동 가이드](./BACKEND-INTEGRATION.md)
- [개발 가이드](./DEVELOPMENT.md)
