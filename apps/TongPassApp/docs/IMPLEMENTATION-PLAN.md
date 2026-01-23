# TongPassApp MVP 구현 계획서

## 개요

`feature/tongpass-full-ui` 브랜치에서 진행할 TongPassApp 전체 화면 구현 계획입니다.

**분기 시점**: develop (6d3dbc8)
**목표**: Figma screen-specs 기반 24개 화면 완전 구현

---

## 1. 현재 상태 vs 목표 상태

### 1.1 화면별 구현 현황

| ID | 화면명 | 현재 상태 | 필요 작업 | 우선순위 |
|----|--------|----------|----------|---------|
| **A00** | 로그인/가입 선택 | ❌ 미구현 | 신규 생성 | P0 |
| **A01** | 회사코드 입력 | ✅ 완성 | 리팩토링 | - |
| **A02** | 현장 선택 | ❌ 미구현 | 신규 생성 | P1 |
| **A03** | 전화번호 입력 | ⚠️ 통합됨 | 분리 필요 | P1 |
| **A04** | 인증번호 입력 | ✅ 완성 | 명세 확인 | - |
| **A05** | 정보 입력 | ✅ 완성 | 선등록 배너 추가 | P2 |
| **A06** | 약관 동의 | ✅ 완성 | 뒤로가기 경고 | P2 |
| **A07** | 전자서명 | ✅ 완성 | 명세 확인 | - |
| **A08** | 승인 대기 | ✅ 완성 | Realtime 구독 | P2 |
| **A09** | 비밀번호 설정 | ❌ 미구현 | 신규 생성 | P1 |
| **L02** | 비밀번호 재설정 | ❌ 미구현 | 신규 생성 | P2 |
| **M01** | 홈 - 출근 전 | ⚠️ 부분 | 상태별 UI 분리 | P0 |
| **M02** | 홈 - 근무 중 | ⚠️ 부분 | QR 생성 추가 | P0 |
| **M03** | 홈 - 퇴근 완료 | ⚠️ 부분 | 상태별 UI | P0 |
| **M04** | 출퇴근 기록 | ❌ 미구현 | 신규 생성 | P1 |
| **P01** | 마이페이지 | ❌ 미구현 | 신규 생성 | P1 |
| **P02** | 프로필 상세 | ❌ 미구현 | 신규 생성 | P1 |
| **P03** | 설정 | ❌ 미구현 | 신규 생성 | P2 |
| **P04** | 참여 회사 목록 | ❌ 미구현 | 신규 생성 | P3 |
| **P05** | 개인 QR 발급 | ❌ 미구현 | 신규 생성 | P2 |
| **Q01** | QR 스캔 | ❌ 미구현 | 신규 생성 | P1 |
| **Q02** | 스캔 성공 | ❌ 미구현 | 신규 생성 | P1 |
| **Q03** | 스캔 실패 | ❌ 미구현 | 신규 생성 | P1 |
| **C00** | 공통 팝업/모달 | ⚠️ 부분 | 컴포넌트화 | P1 |

### 1.2 요약

- **완성**: 6개 화면 (A01, A04, A05, A06, A07, A08)
- **부분 구현**: 4개 화면 (M01-M03 통합, C00)
- **미구현**: 14개 화면

---

## 2. 구현 Phase 계획

### Phase 1: 핵심 인증 및 홈 화면 (P0)

**목표**: 기본 앱 사용 가능 상태

#### 2.1.1 A00 - 로그인/가입 선택 화면
```
파일: src/screens/auth/AuthEntryScreen.tsx
기능:
  - 전화번호 + 비밀번호 로그인
  - "관리자 로그인" 체크박스
  - "가입하기" 버튼 → A01
  - "비밀번호 찾기" → L02
API:
  - POST /auth/login (신규 필요)
의존성: 없음
```

#### 2.1.2 M01/M02/M03 - 홈 화면 통합 개선
```
파일: src/screens/main/HomeScreen.tsx (기존 수정)
변경사항:
  - commuteStatus별 UI 분기 명확화
  - M02 상태: 동적 QR 코드 표시 (30초 갱신)
  - M03 상태: 완료 메시지 및 비활성 버튼
  - 하단 탭바 추가 (홈/기록/마이페이지)
API:
  - GET /worker-qr-payload (QR 생성용)
의존성: react-native-qrcode-svg
```

### Phase 2: 인증 플로우 완성 (P1)

#### 2.2.1 A02 - 현장 선택 화면
```
파일: src/screens/auth/SiteSelectScreen.tsx (신규)
기능:
  - 라디오 버튼 현장 목록
  - 선택 후 A03로 이동
데이터: A01에서 전달받은 sites 배열
의존성: A01
```

#### 2.2.2 A03 - 전화번호 입력 분리
```
파일: src/screens/auth/PhoneInputScreen.tsx (신규)
기능:
  - 전화번호만 입력
  - 자동 하이픈 포맷팅
  - SMS 발송 버튼
API:
  - POST /send-sms
의존성: A01 또는 A02
```

#### 2.2.3 A09 - 비밀번호 설정
```
파일: src/screens/auth/PasswordSetupScreen.tsx (신규)
기능:
  - 비밀번호 + 확인 입력
  - 실시간 유효성 검사 (8자+, 영문/숫자/특수문자)
  - 다음 → A05
의존성: A04
```

#### 2.2.4 M04 - 출퇴근 기록
```
파일: src/screens/main/AttendanceHistoryScreen.tsx (신규)
기능:
  - 월 선택기 (좌우 화살표)
  - 월간 요약 (출근일수, 총 근무시간)
  - 일별 기록 리스트
API:
  - GET /worker-attendance-monthly
의존성: 없음
```

#### 2.2.5 P01 - 마이페이지
```
파일: src/screens/mypage/MyPageScreen.tsx (신규)
기능:
  - 프로필 카드 (이름, 소속, 직책)
  - 이번 달 통계 카드
  - 메뉴 리스트 (출퇴근 기록, 설정, 약관 등)
  - 로그아웃 버튼
API:
  - GET /worker-me (기존)
의존성: 없음
```

#### 2.2.6 P02 - 프로필 상세
```
파일: src/screens/mypage/ProfileDetailScreen.tsx (신규)
기능:
  - 기본 정보 섹션 (이름, 연락처, 생년월일 등)
  - 소속 정보 섹션 (현장, 팀, 직책, 권한)
  - 문의하기 버튼
의존성: P01
```

#### 2.2.7 Q01 - QR 스캔
```
파일: src/screens/qr/QRScanScreen.tsx (신규)
기능:
  - 카메라 프리뷰 + 스캔 프레임
  - 출근/퇴근 모드 토글
  - 플래시 토글
권한: TEAM_ADMIN 이상
API:
  - POST /check-in (QR 출근)
  - POST /check-out (QR 퇴근)
의존성: react-native-camera 또는 expo-camera
```

#### 2.2.8 Q02/Q03 - 스캔 결과
```
파일:
  - src/screens/qr/ScanSuccessScreen.tsx (신규)
  - src/screens/qr/ScanFailureScreen.tsx (신규)
기능:
  - 성공: 체크 애니메이션 + 근로자 정보
  - 실패: X 애니메이션 + 에러 메시지
  - 3초 후 자동 복귀
의존성: Q01
```

#### 2.2.9 C00 - 공통 팝업/모달 컴포넌트화
```
파일: src/components/common/
  - ConfirmModal.tsx (확인/취소)
  - AlertModal.tsx (단일 버튼)
  - BottomSheet.tsx (하단 시트)
  - Toast.tsx (토스트 메시지)
기능: 재사용 가능한 공통 UI 컴포넌트
```

### Phase 3: 부가 기능 (P2)

#### 2.3.1 L02 - 비밀번호 재설정
```
파일: src/screens/auth/PasswordResetScreen.tsx (신규)
기능:
  - 전화번호 입력 → SMS 인증 → 새 비밀번호
  - A03, A04 로직 재사용
API:
  - POST /reset-password
```

#### 2.3.2 P03 - 설정
```
파일: src/screens/mypage/SettingsScreen.tsx (신규)
기능:
  - 알림 설정 토글 (푸시, 출퇴근, 공지사항)
  - 앱 정보 (버전, 라이선스)
  - 계정 (로그아웃, 회원 탈퇴)
API:
  - GET/PATCH /notification-settings
  - DELETE /worker-me
```

#### 2.3.3 P05 - 개인 QR 발급
```
파일: src/screens/mypage/PersonalQRScreen.tsx (신규)
기능:
  - 개인 고유 QR 코드 표시
  - 30초 타이머 + 새로고침
API:
  - GET /worker-qr-payload
의존성: M02 QR 로직 재사용
```

#### 2.3.4 A05 개선 - 선등록 배너
```
파일: src/screens/auth/WorkerInfoScreen.tsx (수정)
변경:
  - 선등록 데이터 존재 시 배너 표시
  - 데이터 충돌 시 선택 옵션
```

#### 2.3.5 A06 개선 - 뒤로가기 경고
```
파일: src/screens/auth/TermsScreen.tsx (수정)
변경:
  - 하나라도 동의한 상태에서 뒤로가기 시 경고 팝업
```

#### 2.3.6 A08 개선 - Realtime 구독
```
파일: src/screens/auth/WaitingScreen.tsx (수정)
변경:
  - Supabase Realtime 구독 추가
  - 실시간 승인 감지
```

### Phase 4: 추가 기능 (P3)

#### 2.4.1 P04 - 참여 회사 목록
```
파일: src/screens/mypage/CompanyListScreen.tsx (신규)
기능:
  - 참여한 회사 목록
  - 회사 선택 → 해당 컨텍스트로 전환
  - 새 회사 추가 버튼
```

---

## 3. 네비게이션 구조 변경

### 3.1 현재 구조
```
RootNavigator
├── AuthStack (8개 화면)
├── WaitingScreen
└── MainStack (HomeScreen만)
```

### 3.2 목표 구조
```
RootNavigator
├── AuthStack (11개 화면)
│   ├── AuthEntry (A00) ← 새 진입점
│   ├── CompanyCode (A01)
│   ├── SiteSelect (A02) ← 신규
│   ├── PhoneInput (A03) ← 분리
│   ├── VerifyCode (A04)
│   ├── PasswordSetup (A09) ← 신규
│   ├── WorkerInfo (A05)
│   ├── Terms (A06)
│   ├── TermsDetail ← 신규
│   ├── Signature (A07)
│   └── PasswordReset (L02) ← 신규
│
├── WaitingScreen (A08)
│
└── MainTabs (BottomTabNavigator)
    ├── HomeStack
    │   └── Home (M01/M02/M03)
    │
    ├── AttendanceStack
    │   └── AttendanceHistory (M04)
    │
    ├── QRStack (TEAM_ADMIN+)
    │   ├── QRScan (Q01)
    │   ├── ScanSuccess (Q02)
    │   └── ScanFailure (Q03)
    │
    └── MyPageStack
        ├── MyPage (P01)
        ├── ProfileDetail (P02)
        ├── Settings (P03)
        ├── CompanyList (P04)
        └── PersonalQR (P05)
```

---

## 4. 필요 API 엔드포인트

### 4.1 기존 API (구현됨)
```
POST /verify-company-code     ✅
POST /send-sms               ✅
POST /verify-sms             ✅
GET  /sites/{id}/teams       ✅
POST /register-worker        ✅
GET  /worker-me              ✅
POST /worker-commute-in      ✅
POST /worker-commute-out     ✅
```

### 4.2 신규 필요 API
```
POST /auth/login                 # A00 로그인
POST /auth/reset-password        # L02 비밀번호 재설정
GET  /worker-qr-payload          # M02, P05 QR 생성 ✅ (구현됨)
GET  /worker-attendance-monthly  # M04 출퇴근 기록 ✅ (구현됨)
POST /check-in                   # Q01 QR 출근 스캔 ✅ (구현됨)
POST /check-out                  # Q01 QR 퇴근 스캔 ✅ (구현됨)
GET  /notification-settings      # P03 알림 설정 조회
PATCH /notification-settings     # P03 알림 설정 변경
DELETE /worker-me                # P03 회원 탈퇴
GET  /companies                  # P04 참여 회사 목록
```

---

## 5. 추가 라이브러리

### 5.1 필수 설치
```bash
# QR 코드 생성 (이미 설치됨)
yarn add react-native-qrcode-svg

# QR 코드 스캔
yarn add react-native-camera
# 또는
yarn add react-native-vision-camera

# 하단 탭 네비게이션
yarn add @react-navigation/bottom-tabs

# 애니메이션 (이미 설치됨)
yarn add react-native-reanimated
```

### 5.2 선택 설치
```bash
# Supabase Realtime (A08 실시간 구독)
yarn add @supabase/supabase-js

# 진동 피드백 (Q02/Q03)
yarn add react-native-haptic-feedback
```

---

## 6. 파일 생성 계획

### 6.1 신규 화면 파일 (14개)
```
src/screens/
├── auth/
│   ├── AuthEntryScreen.tsx        # A00
│   ├── SiteSelectScreen.tsx       # A02
│   ├── PhoneInputScreen.tsx       # A03 (분리)
│   ├── PasswordSetupScreen.tsx    # A09
│   ├── PasswordResetScreen.tsx    # L02
│   └── TermsDetailScreen.tsx      # 약관 상세
│
├── main/
│   └── AttendanceHistoryScreen.tsx # M04
│
├── mypage/
│   ├── MyPageScreen.tsx           # P01
│   ├── ProfileDetailScreen.tsx    # P02
│   ├── SettingsScreen.tsx         # P03
│   ├── CompanyListScreen.tsx      # P04
│   └── PersonalQRScreen.tsx       # P05
│
└── qr/
    ├── QRScanScreen.tsx           # Q01
    ├── ScanSuccessScreen.tsx      # Q02
    └── ScanFailureScreen.tsx      # Q03
```

### 6.2 공통 컴포넌트 (6개)
```
src/components/
├── common/
│   ├── ConfirmModal.tsx
│   ├── AlertModal.tsx
│   ├── BottomSheet.tsx
│   ├── Toast.tsx
│   └── LoadingOverlay.tsx
│
└── qr/
    └── DynamicQRCode.tsx          # 30초 갱신 QR
```

### 6.3 네비게이션 파일 (수정/추가)
```
src/navigation/
├── RootNavigator.tsx              # 수정
├── AuthStack.tsx                  # 수정
├── MainTabs.tsx                   # 신규 (하단 탭)
├── HomeStack.tsx                  # 신규
├── AttendanceStack.tsx            # 신규
├── QRStack.tsx                    # 신규
└── MyPageStack.tsx                # 신규
```

### 6.4 API 파일 (추가)
```
src/api/
├── auth.ts                        # 수정 (login, resetPassword)
├── worker.ts                      # 수정 (attendanceHistory)
├── qr.ts                          # 신규 (scan-check-in/out)
└── settings.ts                    # 신규 (notification settings)
```

---

## 7. 작업 순서 및 예상 작업량

### Phase 1 (P0) - 핵심 기능
| 작업 | 파일 수 | 복잡도 |
|------|--------|--------|
| A00 로그인/가입 선택 | 1 | 중 |
| M01-M03 홈 화면 개선 | 1 | 높음 |
| DynamicQRCode 컴포넌트 | 1 | 중 |
| MainTabs 네비게이션 | 1 | 중 |
| **소계** | **4** | |

### Phase 2 (P1) - 인증/기록/QR
| 작업 | 파일 수 | 복잡도 |
|------|--------|--------|
| A02 현장 선택 | 1 | 낮음 |
| A03 전화번호 분리 | 1 | 낮음 |
| A09 비밀번호 설정 | 1 | 낮음 |
| M04 출퇴근 기록 | 1 | 중 |
| P01 마이페이지 | 1 | 중 |
| P02 프로필 상세 | 1 | 낮음 |
| Q01-Q03 QR 스캔 | 3 | 높음 |
| C00 공통 컴포넌트 | 5 | 중 |
| **소계** | **14** | |

### Phase 3 (P2) - 부가 기능
| 작업 | 파일 수 | 복잡도 |
|------|--------|--------|
| L02 비밀번호 재설정 | 1 | 중 |
| P03 설정 | 1 | 중 |
| P05 개인 QR | 1 | 낮음 |
| A05/A06/A08 개선 | 3 | 낮음 |
| **소계** | **6** | |

### Phase 4 (P3) - 추가 기능
| 작업 | 파일 수 | 복잡도 |
|------|--------|--------|
| P04 참여 회사 목록 | 1 | 낮음 |
| **소계** | **1** | |

**총 신규/수정 파일**: 약 25개

---

## 8. 테스트 계획

### 8.1 단위 테스트
- 유틸리티 함수 (validators, format)
- API 클라이언트 모킹
- Recoil atoms

### 8.2 통합 테스트
- 인증 플로우 (A00 → A08)
- 출퇴근 플로우 (M01 → M02 → M03)
- QR 스캔 플로우 (Q01 → Q02/Q03)

### 8.3 E2E 테스트
- 전체 가입 시나리오
- 선등록 → 동의 시나리오
- QR 출퇴근 시나리오

---

## 9. 체크리스트

### Phase 1 완료 조건
- [ ] A00 로그인/가입 선택 화면 구현
- [ ] HomeScreen QR 코드 표시 (근무 중)
- [ ] HomeScreen 상태별 UI 완성
- [ ] MainTabs 하단 탭 네비게이션 구현
- [ ] 기본 앱 플로우 테스트 완료

### Phase 2 완료 조건
- [ ] 모든 인증 화면 구현 (A02, A03, A09)
- [ ] 출퇴근 기록 화면 구현 (M04)
- [ ] 마이페이지 구현 (P01, P02)
- [ ] QR 스캔 기능 구현 (Q01-Q03)
- [ ] 공통 컴포넌트 라이브러리 완성

### Phase 3 완료 조건
- [ ] 비밀번호 재설정 구현 (L02)
- [ ] 설정 화면 구현 (P03)
- [ ] 개인 QR 화면 구현 (P05)
- [ ] 기존 화면 개선 완료

### Phase 4 완료 조건
- [ ] 참여 회사 목록 구현 (P04)
- [ ] 전체 기능 통합 테스트 완료

---

## 10. 참고 문서

- [Figma Screen Specs](../../../docs/figma/screen-specs/)
- [API 명세](./API.md)
- [개발 가이드](./DEVELOPMENT.md)
- [빌드 설정](./BUILD-SETUP.md)
