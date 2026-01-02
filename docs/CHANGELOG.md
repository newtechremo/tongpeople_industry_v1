# 통패스 (TongPass) 개발 변경 로그

## [0.1.0] - 2026-01-02

### 관리자 웹 (admin-web)

#### 추가된 기능
- **대시보드 페이지**
  - KPI 카드 4종: 총 출근 현황, 퇴근율, 고령자(65세+), 금일 사고
  - 차트 영역 placeholder (Recharts 연동 예정)

- **출퇴근 관리 페이지**
  - 출퇴근 테이블 (필터: 날짜, 현장, 협력업체, 검색)
  - 통계 카드: 총 출근, 퇴근 완료, 근무 중, 고령자
  - 수동 퇴근 처리 버튼
  - 엑셀 다운로드 버튼 (placeholder)

- **설정 페이지**
  - 계정 설정: 회사정보, 대표자, 주소, 사업자등록번호, 업종코드, 직원 수, 담당자 정보
  - 현장 관리: 현장 CRUD, 상세 설정 (현장명, 주소, 책임자, 대표번호, 퇴근모드)

- **근로자 관리 페이지**
  - 팀(업체)별 아코디언 그룹화 목록
  - 팀 관리자 왕관 아이콘 표시
  - 통계 카드: 전체/활성/출근/고령 근로자
  - 신규 동의링크 발송 팝업 (소속팀, 이름, 연락처, 생년월일, 직책, 권한, 국적, 성별)
  - 근로자 상세 Drawer (프로필, 소속, 근무현황, 채용서류, 비상연락처, 건강정보)

- **레이아웃**
  - 사이드바 네비게이션
  - 헤더 (현장 선택, 날짜, 사용자 정보)
  - 반응형 디자인: 모바일(768px 미만) 접속 시 PC 안내 메시지

#### 기술 스택
- React 19 + TypeScript 5.8
- Vite 6
- Tailwind CSS 3.4
- Lucide React (아이콘)
- React Router DOM 7

### 공통 패키지 (shared)

#### 타입 정의
- `Site`: 현장 정보 (name, address, managerName, managerPhone, checkoutPolicy, autoHours)
- `Team`: 팀/업체 정보 (= Partner, 동일 개념)
- `Worker`: 근로자 정보 (기본정보, 소속, 역할, 상태, 근무현황)
- `EmergencyContact`: 비상연락처
- `HealthInfo`: 건강정보 (혈액형, 흡연, 음주, 혈압, 기저질환)
- `WorkerDocument`: 채용 서류 (최대 10개)
- `DocumentType`: 서류 유형 (안전서약서, 교육증, 자격증 등)
- `AttendanceRecord`: 출퇴근 기록
- `CheckoutPolicy`: 퇴근 정책 (AUTO_8H | MANUAL)
- `WorkerStatus`: 근로자 상태 (ACTIVE | INACTIVE | PENDING)
- `AttendanceStatus`: 출퇴근 상태 (CHECKED_IN | CHECKED_OUT | NOT_TODAY)
- `UserRole`: 사용자 역할 (SUPER_ADMIN | SITE_ADMIN | TEAM_ADMIN | WORKER)
- `USER_ROLE_LABELS`: 역할별 한글 라벨
- `DOCUMENT_TYPE_LABELS`: 서류 유형별 한글 라벨
- `QRPayload`: QR 코드 페이로드

#### 상수
- `WORK_DAY_START_HOUR`: 근무일 시작 시간 (04시)
- `DEFAULT_AUTO_CHECKOUT_HOURS`: 자동 퇴근 기준 시간 (8시간)
- `SENIOR_AGE_THRESHOLD`: 고령자 기준 나이 (65세)

### 권한 및 조직 체계

#### 조직 계층 (3단계)
- 회사 > 현장 > 팀(업체)

#### 사용자 역할 (4단계)
- **최고 관리자 (SUPER_ADMIN)**: 회사/본사 - 시스템 전체 설정, 결제 관리
- **현장 관리자 (SITE_ADMIN)**: 현장 소장 - 특정 현장의 모든 데이터 관리
- **팀 관리자 (TEAM_ADMIN)**: 업체장/오반장 - 자기 팀원 QR 스캔
- **근로자 (WORKER)**: 팀원 - QR 생성, 본인 출퇴근 인증

### 백엔드 (Supabase)

#### DB 마이그레이션
- `00001_create_tables.sql`: 테이블 스키마 (companies, sites, partners, users, attendance)
- `00002_rls_policies.sql`: Row Level Security 정책 (역할 기반 접근 제어)

---

## 예정 작업

### Phase 1: 프론트엔드 완성
- [ ] 대시보드 차트 구현 (Recharts)
  - 소속별 인원 막대 차트
  - 역할별 파이 차트

### Phase 2: 백엔드 연동
- [ ] Supabase 테이블 생성 (sites, partners, attendance, workers)
- [ ] API 연동 (mock 데이터 → 실제 데이터)
- [ ] Edge Functions 설정

### Phase 3: 출퇴근 기능
- [ ] QR 스캔 출근 처리
- [ ] 퇴근 로직 (AUTO_8H / MANUAL)
- [ ] 근무일 사이클 (04:00 ~ 익일 03:59)
- [ ] 중복 출근 방지
