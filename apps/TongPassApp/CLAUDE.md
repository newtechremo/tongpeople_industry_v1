# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**통패스 근로자 앱 (TongPass Worker App)**

QR 코드 기반 산업현장 출퇴근 관리 서비스의 **근로자용 모바일 앱**. React Native로 개발된 iOS/Android 크로스플랫폼 앱.

### 관련 서비스
| 앱 | 대상 | 플랫폼 | 주요 기능 |
|----|------|--------|-----------|
| **관리자 웹** | 현장 관리자 | 웹 (React) | 대시보드, QR 스캔, 현장 설정 |
| **근로자 앱** | 현장 근로자 | 모바일 (RN) | 회원가입, 출퇴근 기록 |

### 핵심 기능
- **회원가입**: 회사코드 → SMS 인증 → 정보 입력 → 약관 동의 → 전자서명 → 승인 대기
- **출퇴근**: 버튼 한 번으로 출퇴근 기록
- **상태 확인**: 본인의 출퇴근 상태 실시간 확인

## 권한 및 조직 체계

조직의 계층을 **회사 > 현장 > 팀** 3단계로 고정.

### 조직 계층 구조
```
회사 (Company)
└── 현장 (Site)           예: 대전공장, 서울본사
    └── 팀 (Team)          예: 생산1팀, 협력업체A
        └── 근로자 (Worker)
```

### 사용자 역할 (4단계)

| 역할 | 명칭 | 범위 | 앱 접근 |
|------|------|------|:-------:|
| **SUPER_ADMIN** | 최고 관리자 | 회사 전체 | 웹 전용 |
| **SITE_ADMIN** | 현장 관리자 | 특정 현장 | 웹 전용 |
| **TEAM_ADMIN** | 팀 관리자 | 특정 팀 | 웹 + 앱 |
| **WORKER** | 근로자 | 본인 | 앱 전용 |

### TypeScript 타입
```typescript
type UserRole = 'SUPER_ADMIN' | 'SITE_ADMIN' | 'TEAM_ADMIN' | 'WORKER';
type WorkerStatus = 'PENDING' | 'REQUESTED' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
type CommuteStatus = 'WORK_OFF' | 'WORK_ON' | 'WORK_DONE';
```

## 프로젝트 구조

```
TongPassApp/
├── src/
│   ├── api/                  # API 통신
│   │   ├── client.ts         # Axios 클라이언트 (토큰 갱신)
│   │   ├── auth.ts           # 인증 API
│   │   └── worker.ts         # 근로자 API
│   │
│   ├── screens/              # 화면 컴포넌트
│   │   ├── auth/             # 인증 플로우 (6개 화면)
│   │   │   ├── CompanyCodeScreen.tsx
│   │   │   ├── PhoneVerifyScreen.tsx
│   │   │   ├── WorkerInfoScreen.tsx
│   │   │   ├── TermsScreen.tsx
│   │   │   ├── SignatureScreen.tsx
│   │   │   └── WaitingScreen.tsx
│   │   └── main/
│   │       └── HomeScreen.tsx
│   │
│   ├── navigation/           # 네비게이션
│   │   ├── RootNavigator.tsx # 상태 기반 분기
│   │   ├── AuthStack.tsx     # 인증 플로우
│   │   └── MainStack.tsx     # 메인 화면
│   │
│   ├── store/atoms/          # Recoil 상태 관리
│   │   ├── authAtom.ts       # 인증 토큰
│   │   ├── userAtom.ts       # 사용자 정보
│   │   └── companyAtom.ts    # 회사/현장/팀
│   │
│   ├── types/                # TypeScript 타입
│   ├── constants/            # 상수 (색상, 설정)
│   └── utils/                # 유틸리티 함수
│
├── docs/                     # 문서
├── ios/                      # iOS 네이티브
├── android/                  # Android 네이티브
└── package.json
```

## 기술 스택

### 코어
- React Native 0.74.6 + React 18.2.0
- TypeScript 5.0.4

### 상태 관리
- Recoil 0.7.7
- AsyncStorage 1.23.0

### 네비게이션
- @react-navigation/native 6.1.9
- @react-navigation/native-stack 6.9.17

### API 통신
- Axios 1.6.2

### UI
- react-native-gesture-handler
- react-native-reanimated
- @gorhom/bottom-sheet
- react-native-signature-canvas
- react-native-qrcode-svg

## 개발 명령어

```bash
# 의존성 설치
yarn install

# iOS Pods 설치
cd ios && pod install && cd ..

# 개발 서버 실행
yarn start                # Metro 시작
yarn start:reset          # 캐시 초기화 후 시작

# 앱 실행
yarn ios                  # iOS 시뮬레이터
yarn android              # Android 에뮬레이터

# 빌드
yarn android:build        # Android 릴리스

# 테스트 & 린트
yarn test                 # Jest 테스트
yarn lint                 # ESLint 검사
yarn lint:fix             # 자동 수정
```

## 디자인 시스템

### 테마: 오렌지 그라데이션

```typescript
const colors = {
  // Primary
  primary: '#F97316',        // 오렌지 (주색상)
  primaryDark: '#EA580C',
  primaryLight: '#FFF7ED',

  // 텍스트
  textPrimary: '#1E293B',    // slate-800
  textSecondary: '#64748B',  // slate-500
  textDisabled: '#94A3B8',   // slate-400

  // 상태
  success: '#22C55E',        // green-500
  error: '#EF4444',          // red-500
  warning: '#F59E0B',        // amber-500
  info: '#3B82F6',           // blue-500

  // 테두리
  border: '#E2E8F0',
  borderFocus: '#F97316',
};
```

### 출퇴근 버튼 색상

| 상태 | 코드 | 배경색 | 의미 |
|------|------|--------|------|
| 미출근 | `WORK_OFF` | 파랑 (`#3B82F6`) | 출근하기 |
| 출근중 | `WORK_ON` | 빨강 (`#EF4444`) | 퇴근하기 |
| 퇴근완료 | `WORK_DONE` | 회색 (`#94A3B8`) | 비활성 |

## 네비게이션 플로우

### 인증 플로우 (AuthStack)
```
CompanyCode → PhoneVerify → WorkerInfo → Terms → Signature → Waiting
```

### 상태 기반 라우팅
```typescript
// RootNavigator.tsx
if (!isLoggedIn) return <AuthStack />;
if (workerStatus === 'REQUESTED') return <WaitingScreen />;
if (workerStatus === 'ACTIVE') return <MainStack />;
return <AuthStack />;
```

## API 엔드포인트

### 인증
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/verify-company-code` | 회사코드 검증 |
| POST | `/request-sms` | SMS 인증번호 요청 |
| POST | `/verify-sms` | SMS 인증 확인 |
| GET | `/sites/{siteId}/teams` | 팀 목록 조회 |
| POST | `/register-worker` | 근로자 등록 |

### 근로자
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/worker-me` | 내 정보 조회 |
| POST | `/commute-in` | 출근 |
| POST | `/commute-out` | 퇴근 |

## 주요 상수

### 설정값
```typescript
SMS_VERIFY_TIMEOUT: 180,     // SMS 인증 유효시간 (초)
SENIOR_AGE: 65,              // 고령자 기준 나이
COMPANY_CODE_MIN: 4,         // 회사코드 최소 길이
COMPANY_CODE_MAX: 10,        // 회사코드 최대 길이
```

### 약관 목록
1. 서비스 이용약관 (필수)
2. 개인정보 수집 및 이용 동의 (필수)
3. 개인정보 제3자 제공 동의 (필수)
4. 위치기반 서비스 이용약관 (필수)

## 유틸리티 함수

### 유효성 검사 (validators.ts)
```typescript
isValidPhoneNumber(phone)     // 전화번호 (01X-XXXX-XXXX)
isValidBirthDate(birthDate)   // 생년월일 (YYYYMMDD)
calculateAge(birthDate)       // 만 나이 계산
isSenior(birthDate)           // 65세 이상 판별
isValidEmail(email)           // 이메일 (선택 항목)
isValidCompanyCode(code)      // 회사코드 (4-10자리)
```

### 포맷팅 (format.ts)
```typescript
formatPhoneNumber(phone)      // '010-1234-5678'
formatBirthDate(birthDate)    // '1990.01.01'
```

## 현재 구현 상태

### 완료됨 ✅
- 인증 플로우 UI (6개 화면)
- 네비게이션 구조
- 상태 관리 (Recoil)
- 타입 정의
- API 클라이언트 (Axios)
- 유틸리티 함수

### 미구현 ⏳
- 백엔드 API 실제 연동
- 푸시 알림 (FCM)
- 출퇴근 기록 조회 화면
- 프로필 수정 기능
- 오프라인 모드

## 관련 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| 프로젝트 개요 | `docs/PROJECT-OVERVIEW.md` | 서비스 소개 및 기능 |
| 기술 아키텍처 | `docs/ARCHITECTURE.md` | 기술 스택 및 구조 |
| API 명세 | `docs/API.md` | API 엔드포인트 상세 |
| 개발 가이드 | `docs/DEVELOPMENT.md` | 개발 환경 및 컨벤션 |
