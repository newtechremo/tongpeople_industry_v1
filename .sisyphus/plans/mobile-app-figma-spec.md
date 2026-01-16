# 산업현장통 모바일 앱 Figma UI/UX 스펙 문서 작성 계획

> **작성일**: 2026-01-13
> **브랜치**: feature/worker-signup
> **목표**: Figma 디자인 구현을 위한 화면 목록 및 상세 스펙 문서 작성

---

## 1. 프로젝트 개요

### 목표
- 산업현장통 2.0 근로자 모바일 앱의 **Figma UI 디자인**을 위한 상세 스펙 문서 작성
- 디자이너 또는 Figma Make가 바로 활용할 수 있는 수준의 문서화

### 산출물
1. **화면 목록 및 구조 정리** (`docs/figma/screen-structure.md`)
2. **화면별 상세 스펙 문서** (`docs/figma/screen-specs/`)

### 참조 문서
- `docs/signin/통패스_근로자앱_가입_PRD.md` - 가입 플로우 상세
- `docs/design_guideline_251221.md` - 오렌지 그라데이션 테마
- `.claude/agents/frontend-mobile.md` - RN 개발 가이드

---

## 2. 화면 범위 (총 18개 화면)

### 2.1 인증/가입 플로우 (8개)

| # | 화면명 | 설명 |
|---|--------|------|
| 1 | 회사코드 입력 | 회사 코드 입력하여 진입 |
| 2 | 현장 선택 | 회사에 현장이 2개 이상일 때 선택 |
| 3 | 전화번호 입력 | 본인 인증용 전화번호 입력 |
| 4 | 인증번호 입력 | SMS 인증번호 6자리 입력 |
| 5 | 정보 입력 | 이름, 생년월일, 성별, 국적, 팀, 직책 |
| 6 | 약관 동의 | 4개 필수 약관 체크 |
| 7 | 전자서명 | 터치로 서명 입력 |
| 8 | 승인 대기 | 관리자 승인 대기 화면 (REQUESTED 상태) |

### 2.2 메인 플로우 (4개)

| # | 화면명 | 설명 |
|---|--------|------|
| 9 | 홈 (출근 전) | 출근하기 버튼 표시 |
| 10 | 홈 (근무 중) | QR 코드 + 퇴근하기 버튼 |
| 11 | 홈 (퇴근 완료) | 오늘 근무 완료 상태 |
| 12 | 출퇴근 기록 | 월별 출퇴근 히스토리 리스트 |

### 2.3 QR 스캔 플로우 - 팀관리자용 (3개)

| # | 화면명 | 설명 |
|---|--------|------|
| 13 | QR 스캔 | 카메라로 팀원 QR 스캔 |
| 14 | 스캔 결과 (성공) | 출근/퇴근 처리 완료 |
| 15 | 스캔 결과 (실패) | 만료된 QR, 권한 없음 등 |

### 2.4 마이페이지 (3개)

| # | 화면명 | 설명 |
|---|--------|------|
| 16 | 마이페이지 | 내 정보 요약 + 메뉴 |
| 17 | 내 정보 상세 | 프로필 정보 조회 |
| 18 | 설정 | 알림, 앱 정보, 로그아웃 |

---

## 3. 작업 단계

### Phase 1: 화면 구조 문서 (1개 파일)

**파일**: `docs/figma/screen-structure.md`

**내용**:
- 전체 화면 목록 (18개)
- 화면 간 네비게이션 플로우 다이어그램
- 사용자 역할별 접근 가능 화면 (WORKER vs TEAM_ADMIN)
- 상태별 화면 분기 (PENDING, REQUESTED, ACTIVE)

### Phase 2: 화면별 상세 스펙 (18개 파일)

**폴더**: `docs/figma/screen-specs/`

각 화면 파일 구조:
```markdown
# [화면명]

## 1. 기본 정보
- 화면 ID, 접근 조건, 이전/다음 화면

## 2. 레이아웃 구조
- ASCII 와이어프레임
- 영역 구분 (헤더, 콘텐츠, 푸터)

## 3. UI 컴포넌트
- 컴포넌트 목록 (버튼, 입력필드, 텍스트 등)
- 각 컴포넌트 스타일 (오렌지 테마 적용)

## 4. 상태별 UI 변화
- 로딩, 에러, 빈 상태

## 5. 인터랙션
- 버튼 클릭, 입력 검증, 화면 전환

## 6. 디자인 토큰
- 색상, 폰트, 간격 (Tailwind 클래스)
```

### Phase 3: 디자인 시스템 문서

**파일**: `docs/figma/design-system-mobile.md`

**내용**:
- 오렌지 테마 컬러 팔레트 (모바일용)
- 타이포그래피 스케일
- 공통 컴포넌트 스타일 (버튼, 입력필드, 카드 등)
- 아이콘 가이드 (Lucide)
- 간격/여백 시스템

---

## 4. 작업 순서

| 순서 | 작업 | 산출물 |
|:----:|------|--------|
| 1 | 화면 구조 및 플로우 정리 | `screen-structure.md` |
| 2 | 디자인 시스템 모바일 버전 정리 | `design-system-mobile.md` |
| 3 | 인증/가입 플로우 스펙 (8개) | `01-*.md` ~ `08-*.md` |
| 4 | 메인 플로우 스펙 (4개) | `09-*.md` ~ `12-*.md` |
| 5 | QR 스캔 플로우 스펙 (3개) | `13-*.md` ~ `15-*.md` |
| 6 | 마이페이지 스펙 (3개) | `16-*.md` ~ `18-*.md` |

---

## 5. 디자인 원칙 (오렌지 테마)

### 컬러
```
Primary: #F97316 → #EA580C (그라데이션)
Primary Light: #FFF7ED
Text Primary: #1E293B
Text Secondary: #64748B
Background: #FFFFFF
```

### 버튼 스타일
```
Primary: bg-gradient-to-r from-orange-500 to-orange-600, rounded-xl
Secondary: border border-gray-300, bg-white
Danger: bg-red-600
```

### 입력 필드
```
border border-gray-300 rounded-lg px-4 py-3
focus:border-orange-500 focus:ring-2 focus:ring-orange-100
```

---

## 6. 예상 파일 구조

```
docs/figma/
├── screen-structure.md           # 전체 화면 구조
├── design-system-mobile.md       # 모바일 디자인 시스템
└── screen-specs/
    ├── 01-company-code.md        # 회사코드 입력
    ├── 02-site-select.md         # 현장 선택
    ├── 03-phone-input.md         # 전화번호 입력
    ├── 04-verify-code.md         # 인증번호 입력
    ├── 05-info-input.md          # 정보 입력
    ├── 06-terms-agreement.md     # 약관 동의
    ├── 07-signature.md           # 전자서명
    ├── 08-waiting-approval.md    # 승인 대기
    ├── 09-home-before-work.md    # 홈 (출근 전)
    ├── 10-home-working.md        # 홈 (근무 중)
    ├── 11-home-after-work.md     # 홈 (퇴근 완료)
    ├── 12-attendance-history.md  # 출퇴근 기록
    ├── 13-qr-scan.md             # QR 스캔
    ├── 14-scan-success.md        # 스캔 성공
    ├── 15-scan-failure.md        # 스캔 실패
    ├── 16-mypage.md              # 마이페이지
    ├── 17-profile-detail.md      # 내 정보 상세
    └── 18-settings.md            # 설정
```

---

## 7. 성공 기준

- [ ] 18개 화면 모두 상세 스펙 문서 완성
- [ ] 디자이너가 문서만 보고 Figma 디자인 가능
- [ ] React Native 개발자가 문서 보고 구현 가능
- [ ] 오렌지 테마 일관성 유지
