# Login RRD

RRD = Requirements and Rules Definition.
This document defines login requirements for admin web and worker mobile.

## 1. Scope
- Admin web login (PC): 관리자 계정 로그인
- Worker app login (Mobile): 근로자/팀관리자/개인 로그인
- Explicit login entry screen for mobile (separate from signup flow)

## 2. User Types
- Admin Web: SUPER_ADMIN, SITE_ADMIN
- Worker App: WORKER, TEAM_ADMIN, INDIVIDUAL

## 3. Admin Web Login (PC)

### 3.1 Entry
- Screen: `apps/admin-web/src/pages/LoginPage.tsx`
- Credentials: phone number + password

### 3.2 Rules
- Phone number is the primary identifier.
- Password required (min 8, complexity per existing web policy).
- Login uses Supabase Auth with fake email mapping.

### 3.3 Success
- Session created, redirect to dashboard.

### 3.4 Failure
- Invalid phone/password -> error toast.
- BLOCKED/INACTIVE -> access denied message.

## 4. Mobile Auth Entry (A00)

### 4.1 Role Selection
- Login path includes a pre-login "관리자 로그인" selection.
- Admin login is validated by role after login.

### 4.2 Entry Actions
- Login -> A00 내 로그인 섹션에서 처리
- Signup -> A01 회사코드 입력

## 5. Worker App Login (Mobile)

### 5.1 Entry (new)
- Screen: A00 로그인/가입 선택 (로그인 섹션 포함)
- Purpose: Allow existing users to login without company code.

### 5.2 Flow
1) A00 로그인 섹션 (전화번호 + 비밀번호)
2) 로그인 성공
3) 소속 있음 -> 홈 (M01~M03)
4) 소속 없음 -> 참여 회사 목록 (P04)

### 5.3 Rules
- Company code is not required for login.
- Phone number + password login.
- 관리자 로그인 체크는 로그인 전에 선택.
- 로그인 실패 메시지: "전화번호 또는 비밀번호가 올바르지 않습니다."
- 관리자 체크 실패 메시지: "관리자 권한이 없습니다."
- If status == REQUESTED -> Waiting screen (A08).
- If status == ACTIVE -> Home.

## 6. Signup Flow (Mobile)

### 6.1 Flow
1) A01 회사코드 입력
2) A03 전화번호 입력
3) A04 인증번호 입력
4) A09 비밀번호 설정
5) A05 정보 입력
6) A06 약관 동의
7) A07 전자서명
8) 선등록 여부에 따라 ACTIVE 또는 REQUESTED

### 6.2 Rules
- Company code required for signup.
- Phone number = ID.
- OTP length: 6 digits.
- OTP validity: 3 minutes.
- Resend cooldown: 60 seconds.

## 7. Personal Area (INDIVIDUAL)

### 7.1 Entry
- No company code login allowed.
- If user has no company memberships, land on P04.

### 7.2 Actions
- Add membership via company code (A01).
- Issue personal QR at P05.

## 8. API Notes
- verify-company-code
- send-sms (purpose: LOGIN or SIGNUP)
- verify-sms
- login / signup edge functions (existing)
 - reset-password (mobile password reset)

## 9. Open Questions
- 관리자 로그인을 모바일에서 허용할 범위 (관리자 기능 노출 범위)
