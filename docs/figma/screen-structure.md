# 산업현장통 모바일 앱 - 화면 구조

> **버전**: 1.1  
> **작성일**: 2026-01-20  
> **용도**: Figma UI 디자인 가이드

---

## 1. 전체 화면 목록 (23개)

### 1.1 인증/가입 플로우 (9개 화면)

| ID | 화면명 (한글) | 화면명 (영문) | 파일명 |
|----|--------------|--------------|--------|
| A00 | 로그인/가입 선택 | Auth Entry | `A00-auth-entry.md` |
| A01 | 회사코드 입력 | Company Code | `A01-company-code.md` |
| A02 | 현장 선택 | Site Select | `A02-site-select.md` |
| A03 | 전화번호 입력 | Phone Input | `A03-phone-input.md` |
| A04 | 인증번호 입력 | Verify Code | `A04-verify-code.md` |
| A09 | 비밀번호 설정 | Password Setup | `A09-password-setup.md` |
| A05 | 정보 입력 | Info Input | `A05-info-input.md` |
| A06 | 약관 동의 | Terms Agreement | `A06-terms-agreement.md` |
| A07 | 전자서명 | Signature | `A07-signature.md` |
| A08 | 승인 대기 | Waiting Approval | `A08-waiting-approval.md` |

### 1.2 로그인 플로우 (1개 화면)

| ID | 화면명 (한글) | 화면명 (영문) | 파일명 |
|----|--------------|--------------|--------|
| L02 | 비밀번호 재설정 | Password Reset | `L02-password-reset.md` |

### 1.3 메인 플로우 (4개 화면)

| ID | 화면명 (한글) | 화면명 (영문) | 파일명 |
|----|--------------|--------------|--------|
| M01 | 홈 - 출근 전 | Home Before Work | `M01-home-before-work.md` |
| M02 | 홈 - 근무 중 | Home Working | `M02-home-working.md` |
| M03 | 홈 - 퇴근 완료 | Home After Work | `M03-home-after-work.md` |
| M04 | 출퇴근 기록 | Attendance History | `M04-attendance-history.md` |

### 1.4 QR 스캔 플로우 - 팀관리자 전용 (3개 화면)

| ID | 화면명 (한글) | 화면명 (영문) | 파일명 |
|----|--------------|--------------|--------|
| Q01 | QR 스캔 | QR Scan | `Q01-qr-scan.md` |
| Q02 | 스캔 성공 | Scan Success | `Q02-scan-success.md` |
| Q03 | 스캔 실패 | Scan Failure | `Q03-scan-failure.md` |

### 1.5 마이페이지 (3개 화면)

| ID | 화면명 (한글) | 화면명 (영문) | 파일명 |
|----|--------------|--------------|--------|
| P01 | 마이페이지 | My Page | `P01-mypage.md` |
| P02 | 내 정보 상세 | Profile Detail | `P02-profile-detail.md` |
| P03 | 설정 | Settings | `P03-settings.md` |

### 1.6 개인 영역 (2개 화면)

| ID | 화면명 (한글) | 화면명 (영문) | 파일명 |
|----|--------------|--------------|--------|
| P04 | 참여 회사 목록 | Company List | `P04-company-list.md` |
| P05 | 개인 QR 발급 | Personal QR | `P05-personal-qr.md` |

---

## 2. 사용자 역할별 접근 화면

### 2.1 역할 정의

| 역할 | 코드 | 설명 |
|------|------|------|
| 일반 근로자 | `WORKER` | QR 생성, 본인 출퇴근 확인 |
| 팀 관리자 | `TEAM_ADMIN` | 팀원 QR 스캔, 출퇴근 처리 |
| 개인 사용자 | `INDIVIDUAL` | 참여 회사 목록, 개인 QR |

### 2.2 역할별 화면 접근

| 화면 그룹 | WORKER | TEAM_ADMIN | INDIVIDUAL |
|----------|:------:|:----------:|:----------:|
| 인증/가입 (A00-A09) | O | O | O |
| 로그인 (L02) | O | O | O |
| 홈 - 출근/퇴근 (M01-M03) | O | O | X |
| 출퇴근 기록 (M04) | O | O | X |
| **QR 스캔 (Q01-Q03)** | **X** | **O** | **X** |
| 마이페이지 (P01-P03) | O | O | X |
| 개인 영역 (P04-P05) | X | X | O |

---

## 3. 상태별 화면 분기

### 3.1 근로자 상태 (WorkerStatus)

```typescript
type WorkerStatus = 'PENDING' | 'REQUESTED' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
```

### 3.2 상태별 진입 화면

```
앱 실행
    │
    ▼
┌─────────────────┐
│ 로그인 상태 확인  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
로그인됨    미로그인
    │         │
    ▼         ▼
┌─────────┐  ┌─────────────┐
│상태 확인 │  │ A00 선택 화면 │
└────┬────┘  └──────┬──────┘
     │             │
     │             ├── 로그인 → A00 로그인 섹션
     │             │             ├── 소속 있음 → M01~M03 홈
     │             │             └── 소속 없음 → P04 참여 회사 목록
     │             └── 가입 → A01 회사코드
     │
     ├─── ACTIVE ──────> M01~M03 홈 (근무상태별)
     │
     ├─── REQUESTED ───> A08 승인대기
     │
     ├─── PENDING ─────> A05 정보입력 (선등록 자동완성)
     │
     ├─── INACTIVE ────> 비활성 안내 화면
     │
     └─── BLOCKED ─────> 차단 안내 화면
```

### 3.3 근무 상태 (CommuteStatus)

```typescript
type CommuteStatus = 'WORK_OFF' | 'WORK_ON' | 'WORK_DONE';
```

| 상태 | 한글명 | 표시 화면 | 메인 버튼 |
|------|--------|----------|----------|
| `WORK_OFF` | 출근 전 | M01 | [출근하기] 파란색 |
| `WORK_ON` | 근무 중 | M02 | [퇴근하기] 빨간색 + QR표시 |
| `WORK_DONE` | 퇴근 완료 | M03 | [퇴근 완료] 회색 (비활성) |
