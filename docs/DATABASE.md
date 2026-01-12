# 통패스 데이터베이스 설계

## 1. 개요

### 1.1 데이터베이스
- **DBMS**: PostgreSQL (Supabase 호스팅)
- **인증**: Supabase Auth (UUID 기반)
- **보안**: Row Level Security (RLS) 적용

### 1.2 마이그레이션 파일 위치
```
supabase/
├── migrations/
│   ├── 00001_create_tables.sql      # 핵심 테이블
│   ├── 00002_rls_policies.sql       # RLS 정책
│   └── 00003_functions.sql          # DB 함수
└── seed.sql                         # 테스트 데이터
```

---

## 2. ER 다이어그램

```
┌─────────────┐
│  companies  │
│─────────────│
│  id (PK)    │
│  name       │
│  biz_number │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐      ┌─────────────┐
│    sites    │      │  partners   │
│─────────────│      │─────────────│
│  id (PK)    │      │  id (PK)    │
│  company_id │◄────►│  company_id │
│  name       │      │  site_id    │
│  policy     │      │  name       │
└──────┬──────┘      └──────┬──────┘
       │                    │
       │ 1:N                │ 1:N
       ▼                    ▼
┌──────────────────────────────────┐
│              users               │
│──────────────────────────────────│
│  id (PK, UUID)                   │
│  company_id (FK)                 │
│  site_id (FK)                    │
│  partner_id (FK)                 │
│  email, name, phone, birth_date  │
│  role (ENUM)                     │
└─────────────────┬────────────────┘
                  │ 1:N
                  ▼
┌──────────────────────────────────┐
│           attendances            │
│──────────────────────────────────│
│  id (PK)                         │
│  work_date                       │
│  site_id (FK)                    │
│  partner_id (FK)                 │
│  user_id (FK)                    │
│  check_in_time, check_out_time   │
│  is_senior, is_auto_out          │
└──────────────────────────────────┘
```

---

## 3. 테이블 상세 (Phase 1)

### 3.1 companies (회사)

서비스를 이용하는 회사(고객사) 정보.

```sql
CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  business_number VARCHAR(20) UNIQUE,
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGSERIAL | PK |
| `name` | VARCHAR(100) | 회사명 |
| `business_number` | VARCHAR(20) | 사업자등록번호 (UNIQUE) |
| `contact_email` | VARCHAR(100) | 담당자 이메일 |
| `contact_phone` | VARCHAR(20) | 담당자 연락처 |
| `is_active` | BOOLEAN | 활성 상태 |
| `created_at` | TIMESTAMPTZ | 생성일시 |
| `updated_at` | TIMESTAMPTZ | 수정일시 |

### 3.2 sites (현장)

회사에 소속된 작업 현장.

```sql
CREATE TABLE sites (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(500),
  checkout_policy checkout_policy DEFAULT 'AUTO_8H',
  auto_hours INTEGER DEFAULT 8,
  work_day_start_hour INTEGER DEFAULT 4,
  senior_age_threshold INTEGER DEFAULT 65,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sites_company ON sites(company_id);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGSERIAL | PK |
| `company_id` | BIGINT | FK → companies |
| `name` | VARCHAR(200) | 현장명 |
| `address` | VARCHAR(500) | 주소 |
| `checkout_policy` | ENUM | 퇴근 정책 (AUTO_8H / MANUAL) |
| `auto_hours` | INTEGER | 자동 퇴근 시간 (기본: 8) |
| `work_day_start_hour` | INTEGER | 근무일 시작 시간 (기본: 4) |
| `senior_age_threshold` | INTEGER | 고령자 기준 나이 (기본: 65) |
| `is_active` | BOOLEAN | 활성 상태 |

### 3.3 partners (협력업체/팀)

현장에 투입되는 협력업체 또는 팀.

```sql
CREATE TABLE partners (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  site_id BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  contact_name VARCHAR(50),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partners_company ON partners(company_id);
CREATE INDEX idx_partners_site ON partners(site_id);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGSERIAL | PK |
| `company_id` | BIGINT | FK → companies |
| `site_id` | BIGINT | FK → sites |
| `name` | VARCHAR(100) | 업체/팀명 |
| `contact_name` | VARCHAR(50) | 담당자명 |
| `contact_phone` | VARCHAR(20) | 담당자 연락처 |
| `is_active` | BOOLEAN | 활성 상태 |

### 3.4 users (사용자)

Supabase Auth와 연동되는 사용자 정보.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  site_id BIGINT REFERENCES sites(id) ON DELETE SET NULL,
  partner_id BIGINT REFERENCES partners(id) ON DELETE SET NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  birth_date DATE,
  role user_role DEFAULT 'WORKER',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_site ON users(site_id);
CREATE INDEX idx_users_partner ON users(partner_id);
CREATE INDEX idx_users_role ON users(role);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK (auth.users 연동) |
| `company_id` | BIGINT | FK → companies |
| `site_id` | BIGINT | FK → sites (소속 현장) |
| `partner_id` | BIGINT | FK → partners (소속 팀) |
| `email` | VARCHAR(100) | 이메일 (UNIQUE) |
| `name` | VARCHAR(50) | 이름 |
| `phone` | VARCHAR(20) | 연락처 |
| `birth_date` | DATE | 생년월일 |
| `role` | ENUM | 역할 |
| `is_active` | BOOLEAN | 활성 상태 |

### 3.5 attendances (출퇴근 기록)

일별 출퇴근 기록.

```sql
CREATE TABLE attendances (
  id BIGSERIAL PRIMARY KEY,
  work_date DATE NOT NULL,
  site_id BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  partner_id BIGINT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 스냅샷 데이터
  worker_name VARCHAR(50) NOT NULL,
  role user_role NOT NULL,
  birth_date DATE,
  age INTEGER,
  is_senior BOOLEAN DEFAULT FALSE,
  
  -- 출퇴근 시간
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  
  -- 상태 플래그
  is_auto_out BOOLEAN DEFAULT FALSE,
  has_accident BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_attendance_per_day UNIQUE (work_date, site_id, user_id)
);

CREATE INDEX idx_attendances_work_date ON attendances(work_date);
CREATE INDEX idx_attendances_site ON attendances(site_id);
CREATE INDEX idx_attendances_user ON attendances(user_id);
CREATE INDEX idx_attendances_site_date ON attendances(site_id, work_date);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | BIGSERIAL | PK |
| `work_date` | DATE | 근무일 |
| `site_id` | BIGINT | FK → sites |
| `partner_id` | BIGINT | FK → partners |
| `user_id` | UUID | FK → users |
| `worker_name` | VARCHAR(50) | 근로자명 (스냅샷) |
| `role` | ENUM | 역할 (스냅샷) |
| `birth_date` | DATE | 생년월일 (스냅샷) |
| `age` | INTEGER | 출근 시점 나이 |
| `is_senior` | BOOLEAN | 고령자 여부 |
| `check_in_time` | TIMESTAMPTZ | 출근 시간 |
| `check_out_time` | TIMESTAMPTZ | 퇴근 시간 |
| `is_auto_out` | BOOLEAN | 자동 퇴근 여부 |
| `has_accident` | BOOLEAN | 사고 발생 여부 |
| `notes` | TEXT | 비고 |

---

## 4. ENUM 타입

### 4.1 checkout_policy
```sql
CREATE TYPE checkout_policy AS ENUM ('AUTO_8H', 'MANUAL');
```

| 값 | 설명 |
|----|------|
| `AUTO_8H` | 출근 후 8시간 경과 시 자동 퇴근 |
| `MANUAL` | 반드시 QR 스캔으로 퇴근 인증 |

### 4.2 user_role
```sql
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN', 'WORKER');
```

| 값 | 설명 | 범위 |
|----|------|------|
| `SUPER_ADMIN` | 최고 관리자 | 회사 전체 |
| `SITE_ADMIN` | 현장 관리자 | 특정 현장 |
| `TEAM_ADMIN` | 팀 관리자 | 특정 팀 |
| `WORKER` | 근로자 | 본인 |

---

## 5. 데이터베이스 함수

### 5.1 나이 계산
```sql
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE, base_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(base_date, birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 5.2 근무일 계산
```sql
CREATE OR REPLACE FUNCTION get_work_date(check_time TIMESTAMPTZ, start_hour INTEGER DEFAULT 4)
RETURNS DATE AS $$
BEGIN
  IF EXTRACT(HOUR FROM check_time) < start_hour THEN
    RETURN (check_time - INTERVAL '1 day')::DATE;
  ELSE
    RETURN check_time::DATE;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 5.3 updated_at 자동 갱신
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 트리거 적용
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. Row Level Security (RLS)

### 6.1 RLS 헬퍼 함수

```sql
-- 현재 사용자의 회사 ID
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS BIGINT AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 현재 사용자의 현장 ID
CREATE OR REPLACE FUNCTION get_user_site_id()
RETURNS BIGINT AS $$
  SELECT site_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 현재 사용자의 팀 ID
CREATE OR REPLACE FUNCTION get_user_partner_id()
RETURNS BIGINT AS $$
  SELECT partner_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 현재 사용자의 역할
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 최고 관리자 여부
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'SUPER_ADMIN';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 현장 관리자 이상 여부
CREATE OR REPLACE FUNCTION is_site_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('SUPER_ADMIN', 'SITE_ADMIN');
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 6.2 테이블별 RLS 정책

```sql
-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "Super admin can manage company" ON companies
  FOR ALL USING (is_super_admin());

-- sites
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sites in own company" ON sites
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Super admin can manage all sites" ON sites
  FOR ALL USING (is_super_admin());

CREATE POLICY "Site admin can manage own site" ON sites
  FOR UPDATE USING (
    get_user_role() = 'SITE_ADMIN' AND id = get_user_site_id()
  );

-- attendances
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can access all attendances" ON attendances
  FOR ALL USING (is_super_admin());

CREATE POLICY "Site admin can access site attendances" ON attendances
  FOR ALL USING (
    get_user_role() = 'SITE_ADMIN' AND site_id = get_user_site_id()
  );

CREATE POLICY "Team admin can access team attendances" ON attendances
  FOR ALL USING (
    get_user_role() = 'TEAM_ADMIN' AND partner_id = get_user_partner_id()
  );

CREATE POLICY "Worker can view own attendances" ON attendances
  FOR SELECT USING (user_id = auth.uid());
```

---

## 7. 자주 사용하는 쿼리

### 7.1 오늘 출근 현황

```sql
SELECT
  a.id,
  a.worker_name,
  a.check_in_time,
  a.check_out_time,
  a.is_senior,
  p.name as team_name
FROM attendances a
LEFT JOIN partners p ON a.partner_id = p.id
WHERE a.site_id = :site_id
  AND a.work_date = CURRENT_DATE
ORDER BY a.check_in_time DESC;
```

### 7.2 대시보드 KPI

```sql
SELECT
  COUNT(*) as total_workers,
  COUNT(*) FILTER (WHERE check_out_time IS NOT NULL) as checked_out,
  COUNT(*) FILTER (WHERE is_senior) as senior_count,
  COUNT(*) FILTER (WHERE has_accident) as accident_count
FROM attendances
WHERE site_id = :site_id
  AND work_date = CURRENT_DATE;
```

### 7.3 고령자 목록

```sql
SELECT
  u.id,
  u.name,
  u.birth_date,
  calculate_age(u.birth_date) as age,
  p.name as team_name
FROM users u
LEFT JOIN partners p ON u.partner_id = p.id
WHERE u.site_id = :site_id
  AND u.is_active = true
  AND calculate_age(u.birth_date) >= 65
ORDER BY u.birth_date ASC;
```

### 7.4 자동 퇴근 대상 조회

```sql
SELECT a.*
FROM attendances a
JOIN sites s ON a.site_id = s.id
WHERE a.work_date = CURRENT_DATE
  AND a.check_out_time IS NULL
  AND s.checkout_policy = 'AUTO_8H'
  AND a.check_in_time + (s.auto_hours * INTERVAL '1 hour') < NOW();
```

---

## 8. Phase 2 확장 (교대 근무) - 예정

> ⚠️ **이 섹션은 Phase 2에서 구현 예정입니다.**

### 8.1 partners 테이블 확장

```sql
-- Phase 2에서 추가될 컬럼
ALTER TABLE partners ADD COLUMN work_type work_type DEFAULT 'STANDARD_8H';
ALTER TABLE partners ADD COLUMN shift_pattern shift_pattern DEFAULT 'NONE';
ALTER TABLE partners ADD COLUMN shift_start_time TIME;
ALTER TABLE partners ADD COLUMN shift_end_time TIME;
ALTER TABLE partners ADD COLUMN shift_hours INTEGER DEFAULT 8;
ALTER TABLE partners ADD COLUMN break_minutes INTEGER DEFAULT 60;
ALTER TABLE partners ADD COLUMN overlap_minutes INTEGER DEFAULT 30;
ALTER TABLE partners ADD COLUMN is_overnight BOOLEAN DEFAULT FALSE;
```

### 8.2 추가 ENUM 타입

```sql
-- Phase 2에서 추가될 ENUM
CREATE TYPE work_type AS ENUM ('STANDARD_8H', 'TWO_SHIFT', 'THREE_SHIFT');
CREATE TYPE shift_pattern AS ENUM ('NONE', 'DAY', 'NIGHT', 'SHIFT_1', 'SHIFT_2', 'SHIFT_3');
```

### 8.3 attendances 테이블 확장

```sql
-- Phase 2에서 추가될 컬럼
ALTER TABLE attendances ADD COLUMN work_type work_type DEFAULT 'STANDARD_8H';
ALTER TABLE attendances ADD COLUMN shift_pattern shift_pattern DEFAULT 'NONE';
ALTER TABLE attendances ADD COLUMN scheduled_start TIME;
ALTER TABLE attendances ADD COLUMN scheduled_end TIME;
ALTER TABLE attendances ADD COLUMN is_overnight BOOLEAN DEFAULT FALSE;
ALTER TABLE attendances ADD COLUMN is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE attendances ADD COLUMN actual_work_minutes INTEGER;
```

---

## 9. 시드 데이터

### 9.1 테스트 데이터 예시

```sql
-- seed.sql

-- 회사
INSERT INTO companies (name, business_number, contact_email) VALUES
('테스트 제조(주)', '123-45-67890', 'admin@test-mfg.com');

-- 현장
INSERT INTO sites (company_id, name, address) VALUES
(1, '본사 공장', '서울시 강남구 테헤란로 123');

-- 팀
INSERT INTO partners (company_id, site_id, name, contact_name) VALUES
(1, 1, '생산1팀', '김팀장'),
(1, 1, '생산2팀', '이팀장'),
(1, 1, '품질관리팀', '박팀장');

-- 사용자 (auth.users와 연동 필요)
-- Supabase Dashboard에서 먼저 auth.users 생성 후 users 테이블에 삽입
```

---

## 10. 관련 문서

- [프로젝트 개요](./PROJECT-OVERVIEW.md)
- [기술 아키텍처](./ARCHITECTURE.md)
- [개발 가이드](./DEVELOPMENT.md)
