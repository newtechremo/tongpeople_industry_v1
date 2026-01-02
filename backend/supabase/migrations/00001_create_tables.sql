-- =============================================
-- 산업현장통 (통패스) 데이터베이스 스키마
-- =============================================

-- ENUM 타입 정의
CREATE TYPE checkout_policy AS ENUM ('AUTO_8H', 'MANUAL');
CREATE TYPE user_role AS ENUM ('관리자', '근로자');

-- =============================================
-- 1. 회사 테이블 (companies)
-- =============================================
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    business_number VARCHAR(20),  -- 사업자등록번호
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE companies IS '회사 (서비스 이용 업체)';

-- =============================================
-- 2. 현장 테이블 (sites)
-- =============================================
CREATE TABLE sites (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    checkout_policy checkout_policy DEFAULT 'AUTO_8H',
    auto_hours INTEGER DEFAULT 8,  -- 자동 퇴근 기준 시간
    work_day_start_hour INTEGER DEFAULT 4,  -- 근무일 시작 시간 (기본 04:00)
    senior_age_threshold INTEGER DEFAULT 65,  -- 고령자 기준 나이
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sites IS '현장';
COMMENT ON COLUMN sites.checkout_policy IS '퇴근 정책: AUTO_8H(자동 8시간), MANUAL(수동)';
COMMENT ON COLUMN sites.work_day_start_hour IS '근무일 시작 시간 (0-23). 해당 시간부터 다음날 해당 시간 전까지가 하나의 근무일';

CREATE INDEX idx_sites_company ON sites(company_id);

-- =============================================
-- 3. 협력업체 테이블 (partners)
-- =============================================
CREATE TABLE partners (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(50),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE partners IS '협력업체';

CREATE INDEX idx_partners_company ON partners(company_id);

-- =============================================
-- 4. 사용자 테이블 (users) - Supabase Auth 연동
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id BIGINT REFERENCES companies(id),
    partner_id BIGINT REFERENCES partners(id),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    birth_date DATE,
    role user_role DEFAULT '근로자',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS '사용자 (관리자/근로자)';

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_partner ON users(partner_id);

-- =============================================
-- 5. 출퇴근 기록 테이블 (attendance)
-- =============================================
CREATE TABLE attendance (
    id BIGSERIAL PRIMARY KEY,
    work_date DATE NOT NULL,  -- 작업일 (근무일 기준)
    site_id BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    partner_id BIGINT REFERENCES partners(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL,
    birth_date DATE,
    age INTEGER,  -- 출근 시점 기준 나이
    is_senior BOOLEAN DEFAULT FALSE,  -- 고령자 여부
    check_in_time TIMESTAMPTZ,  -- 출근 시간
    check_out_time TIMESTAMPTZ,  -- 퇴근 시간
    is_auto_out BOOLEAN DEFAULT FALSE,  -- 자동 퇴근 처리 여부
    has_accident BOOLEAN DEFAULT FALSE,  -- 사고 발생 여부
    notes TEXT,  -- 비고
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 동일 근무일에 중복 출근 방지
    CONSTRAINT unique_attendance_per_day UNIQUE (work_date, site_id, user_id)
);

COMMENT ON TABLE attendance IS '출퇴근 기록';
COMMENT ON COLUMN attendance.work_date IS '근무일 (현장 설정에 따라 04:00 기준 등)';
COMMENT ON COLUMN attendance.is_auto_out IS '자동 퇴근 처리 여부 (AUTO_8H 모드)';

CREATE INDEX idx_attendance_work_date ON attendance(work_date);
CREATE INDEX idx_attendance_site ON attendance(site_id);
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_site_date ON attendance(site_id, work_date);

-- =============================================
-- 6. Updated_at 자동 갱신 트리거
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. 나이 계산 함수
-- =============================================
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE, base_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM age(base_date, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- 8. 근무일 계산 함수
-- =============================================
CREATE OR REPLACE FUNCTION get_work_date(check_time TIMESTAMPTZ, start_hour INTEGER DEFAULT 4)
RETURNS DATE AS $$
DECLARE
    adjusted_time TIMESTAMPTZ;
BEGIN
    -- start_hour 이전이면 전날로 처리
    IF EXTRACT(HOUR FROM check_time) < start_hour THEN
        adjusted_time := check_time - INTERVAL '1 day';
    ELSE
        adjusted_time := check_time;
    END IF;

    RETURN adjusted_time::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
