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
- `Partner`: 협력업체
- `AttendanceRecord`: 출퇴근 기록
- `CheckoutPolicy`: 퇴근 정책 (AUTO_8H | MANUAL)
- `QRPayload`: QR 코드 페이로드

#### 상수
- `WORK_DAY_START_HOUR`: 근무일 시작 시간 (04시)
- `DEFAULT_AUTO_CHECKOUT_HOURS`: 자동 퇴근 기준 시간 (8시간)
- `SENIOR_AGE_THRESHOLD`: 고령자 기준 나이 (65세)

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
