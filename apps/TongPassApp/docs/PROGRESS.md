# TongPassApp 개발 진행 상황

> 최종 업데이트: 2026-01-16

## 1. 프로젝트 개요

**TongPass 근로자 앱** - QR 코드 기반 산업현장 출퇴근 관리 서비스의 근로자용 모바일 앱

- **플랫폼**: React Native 0.74.6 (iOS/Android)
- **상태 관리**: Recoil + AsyncStorage
- **API 통신**: Axios (토큰 갱신 지원)

---

## 2. 완료된 작업

### 2.1 프로젝트 초기 설정
- [x] React Native 프로젝트 생성
- [x] TypeScript 설정
- [x] 필수 라이브러리 설치 (react-navigation, recoil, axios 등)
- [x] 프로젝트 구조 설계

### 2.2 인증 플로우 구현
- [x] **CompanyCodeScreen** - 회사코드 입력 화면
- [x] **PhoneVerifyScreen** - SMS 인증 화면 (타이머 포함)
- [x] **WorkerInfoScreen** - 근로자 정보 입력 (이름, 생년월일, 성별, 국적, 직종, 팀)
- [x] **TermsScreen** - 약관 동의 (4개 필수 약관)
- [x] **SignatureScreen** - 전자서명
- [x] **WaitingScreen** - 승인 대기 (30초 폴링)

### 2.3 메인 기능 구현
- [x] **HomeScreen** - 출퇴근 버튼, 상태 표시, 로그아웃
- [x] 출퇴근 상태별 UI (출근 전/근무 중/퇴근 완료)

### 2.4 상태 관리
- [x] authAtom - 인증 토큰 (accessToken, refreshToken)
- [x] userAtom - 사용자 정보, 근로자 상태, 출퇴근 상태
- [x] companyAtom - 회사, 현장, 팀 정보

### 2.5 API 클라이언트
- [x] Axios 인스턴스 설정
- [x] 토큰 자동 갱신 (401 에러 시)
- [x] 요청 큐 관리 (토큰 갱신 중 중복 방지)
- [x] ApiError 클래스 (에러 코드별 사용자 메시지)

### 2.6 유틸리티
- [x] validators.ts - 전화번호, 생년월일, 이메일, 회사코드 검증
- [x] format.ts - 전화번호, 생년월일 포맷팅
- [x] useTimer 훅 - SMS 인증 타이머
- [x] useApi 훅 - API 호출 상태 관리

### 2.7 빌드 및 테스트
- [x] TypeScript 컴파일 오류 해결
- [x] ESLint 오류 해결
- [x] Android 릴리즈 빌드 성공
- [x] 실제 기기 테스트 완료 (Samsung Galaxy)

---

## 3. Mock 서버

테스트용 Mock API 서버 구현 완료.

### 위치
```
TongPassApp/mock-server/
├── package.json
└── server.js
```

### 실행 방법
```bash
cd mock-server
npm install
node server.js
```

### 테스트 정보
| 항목 | 값 |
|------|-----|
| 회사코드 | `TEST1234` |
| SMS 인증번호 | `123456` |
| 서버 포트 | `3000` |

### 관리자 API
```bash
# 근로자 승인
curl -X POST http://localhost:3000/admin/approve-worker/{workerId}

# 출퇴근 초기화 (개별)
curl -X POST http://localhost:3000/admin/reset-commute/{workerId}

# 출퇴근 초기화 (전체)
curl -X POST http://localhost:3000/admin/reset-commute

# 전체 데이터 조회
curl http://localhost:3000/admin/data

# 전체 데이터 초기화
curl -X POST http://localhost:3000/admin/reset-all
```

### 주요 기능
- 사용자별 출퇴근 상태 관리 (v2)
- 토큰 기반 사용자 식별
- 근로자 등록/승인 플로우

---

## 4. 실제 기기 테스트 결과

### 테스트 환경
- 기기: Samsung Galaxy (Android 15)
- 연결: USB (ADB 포트 포워딩)

### 테스트 완료 항목
- [x] 회사코드 입력 및 검증
- [x] SMS 인증번호 요청/확인
- [x] 근로자 정보 입력 (팀 선택 포함)
- [x] 약관 동의
- [x] 전자서명
- [x] 승인 대기 화면 (관리자 승인 후 홈 이동)
- [x] 출근/퇴근 버튼 동작
- [x] 근무시간 계산 표시
- [x] 로그아웃

### 수정된 설정
- `AndroidManifest.xml`: `android:usesCleartextTraffic="true"` 추가 (HTTP 허용)
- `android/local.properties`: Android SDK 경로 설정

---

## 5. tongpeople_industry_v1 백엔드 분석

### 기술 스택
- Supabase Edge Functions (Deno/TypeScript)
- PostgreSQL
- Supabase Auth (JWT)
- 네이버 클라우드 SENS (SMS)

### 출퇴근 API (QR 기반)

**출근**: `POST /functions/v1/check-in`
```json
{
  "site_id": 1,
  "qr_payload": {
    "workerId": "uuid",
    "timestamp": 1234567890,
    "expiresAt": 1234567920
  }
}
```

**퇴근**: `POST /functions/v1/check-out`
```json
{
  "site_id": 1,
  "qr_payload": {
    "workerId": "uuid",
    "timestamp": 1234567890,
    "expiresAt": 1234567920
  }
}
```

### 현재 앱 vs 백엔드 API 비교

| 기능 | TongPassApp | tongpeople 백엔드 | 상태 |
|------|-------------|------------------|------|
| 회사코드 검증 | O | X | 백엔드 추가 필요 |
| SMS 요청 | O | O (형식 다름) | 앱 수정 필요 |
| SMS 검증 | O | O (형식 다름) | 앱 수정 필요 |
| 근로자 등록 | O | X | 백엔드 추가 필요 |
| 출근 | 버튼 방식 | QR 스캔 방식 | 방식 결정 필요 |
| 퇴근 | 버튼 방식 | QR 스캔 방식 | 방식 결정 필요 |
| 내 정보 조회 | O | X | 백엔드 추가 필요 |

### 주요 차이점
1. **출퇴근 방식**: 백엔드는 QR 코드 스캔 기반 (관리자가 스캔)
2. **인증 대상**: 백엔드는 관리자용 로그인만 존재
3. **근로자 등록**: 테스트용 시드만 존재, 실제 등록 API 없음

---

## 6. 다음 단계 (미결정)

백엔드 연동을 위해 두 가지 방법 중 선택 필요:

### 방법 1: 백엔드에 근로자용 API 추가
- 근로자 로그인/등록 Edge Function 구현
- 버튼 기반 출퇴근 API 구현
- Supabase Edge Function 추가 개발

### 방법 2: 앱을 QR 스캔 방식으로 변경
- 앱에서 QR 코드 생성 (workerId + timestamp)
- 관리자 웹에서 QR 스캔하여 출퇴근 처리
- 앱은 상태 조회만 수행

---

## 7. 파일 구조

```
TongPassApp/
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios 인스턴스
│   │   ├── auth.ts            # 인증 API
│   │   └── worker.ts          # 근로자 API
│   ├── screens/
│   │   ├── auth/              # 인증 플로우 (6개 화면)
│   │   └── main/
│   │       └── HomeScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   └── MainStack.tsx
│   ├── store/atoms/
│   │   ├── authAtom.ts
│   │   ├── userAtom.ts
│   │   └── companyAtom.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useTimer.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── user.ts
│   │   ├── company.ts
│   │   ├── navigation.ts
│   │   └── env.d.ts
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── config.ts
│   │   └── index.ts
│   └── utils/
│       ├── validators.ts
│       └── format.ts
├── mock-server/
│   ├── package.json
│   └── server.js
├── docs/
│   ├── PROJECT-OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEVELOPMENT.md
│   └── PROGRESS.md            # 이 파일
├── .env
├── CLAUDE.md
└── package.json
```

---

## 8. 빠른 시작 가이드

### Mock 서버로 테스트
```bash
# 1. Mock 서버 시작
cd mock-server && node server.js

# 2. ADB 포트 포워딩 (실제 기기)
adb reverse tcp:3000 tcp:3000

# 3. 앱 빌드 및 설치
cd android && ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk

# 4. 테스트
# - 회사코드: TEST1234
# - SMS 인증번호: 123456
```

### 승인 처리
```bash
# 데이터 확인
curl http://localhost:3000/admin/data

# 승인
curl -X POST http://localhost:3000/admin/approve-worker/{workerId}
```

---

## 9. 알려진 이슈

1. **HTTP 트래픽**: Android 9+에서 cleartext HTTP 차단
   - 해결: AndroidManifest.xml에 `usesCleartextTraffic="true"` 추가

2. **ADB 연결**: USB 디버깅 권한 필요
   - 해결: 기기에서 USB 디버깅 허용 팝업 승인

3. **토큰 저장**: AsyncStorage는 암호화되지 않음
   - 프로덕션: react-native-keychain 등 보안 저장소 사용 권장

---

## 10. 참고 문서

- [CLAUDE.md](/CLAUDE.md) - Claude Code 가이드
- [PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md) - 서비스 소개
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 기술 아키텍처
- [API.md](./API.md) - API 명세
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 개발 가이드
