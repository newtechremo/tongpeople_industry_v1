-- =============================================
-- 산업현장통 (통패스) - 전체 마이그레이션
-- Supabase SQL Editor에서 한 번에 실행
-- =============================================

-- =============================================
-- 00001: 기본 테이블 생성
-- =============================================

-- ENUM 타입 정의
CREATE TYPE checkout_policy AS ENUM ('AUTO_8H', 'MANUAL');
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN', 'WORKER');

-- 1. 회사 테이블 (companies)
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    business_number VARCHAR(20),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE companies IS '회사 (서비스 이용 업체)';

-- 2. 현장 테이블 (sites)
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

COMMENT ON TABLE sites IS '현장';
COMMENT ON COLUMN sites.checkout_policy IS '퇴근 정책: AUTO_8H(자동 8시간), MANUAL(수동)';
COMMENT ON COLUMN sites.work_day_start_hour IS '근무일 시작 시간 (0-23)';

CREATE INDEX idx_sites_company ON sites(company_id);

-- 3. 협력업체 테이블 (partners)
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

-- 4. 사용자 테이블 (users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id BIGINT REFERENCES companies(id),
    site_id BIGINT REFERENCES sites(id),
    partner_id BIGINT REFERENCES partners(id),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    birth_date DATE,
    role user_role DEFAULT 'WORKER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS '사용자 (관리자/근로자)';

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_site ON users(site_id);
CREATE INDEX idx_users_partner ON users(partner_id);

-- 5. 출퇴근 기록 테이블 (attendance)
CREATE TABLE attendance (
    id BIGSERIAL PRIMARY KEY,
    work_date DATE NOT NULL,
    site_id BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    partner_id BIGINT REFERENCES partners(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL,
    birth_date DATE,
    age INTEGER,
    is_senior BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    is_auto_out BOOLEAN DEFAULT FALSE,
    has_accident BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_attendance_per_day UNIQUE (work_date, site_id, user_id)
);

COMMENT ON TABLE attendance IS '출퇴근 기록';

CREATE INDEX idx_attendance_work_date ON attendance(work_date);
CREATE INDEX idx_attendance_site ON attendance(site_id);
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_site_date ON attendance(site_id, work_date);

-- 6. Updated_at 자동 갱신 트리거
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

-- 7. 나이 계산 함수
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE, base_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM age(base_date, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. 근무일 계산 함수
CREATE OR REPLACE FUNCTION get_work_date(check_time TIMESTAMPTZ, start_hour INTEGER DEFAULT 4)
RETURNS DATE AS $$
DECLARE
    adjusted_time TIMESTAMPTZ;
BEGIN
    IF EXTRACT(HOUR FROM check_time) < start_hour THEN
        adjusted_time := check_time - INTERVAL '1 day';
    ELSE
        adjusted_time := check_time;
    END IF;
    RETURN adjusted_time::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- 00002: RLS 정책
-- =============================================

-- RLS 활성화
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 사용자의 회사 ID 가져오기 함수
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT company_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 역할 확인 함수들
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'SUPER_ADMIN' FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_site_admin_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('SUPER_ADMIN', 'SITE_ADMIN') FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_team_admin_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN') FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_site_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT site_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_partner_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT partner_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Companies 정책
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    USING (id = get_user_company_id());

CREATE POLICY "Super admins can update their company"
    ON companies FOR UPDATE
    USING (id = get_user_company_id() AND is_super_admin());

-- Sites 정책
CREATE POLICY "Users can view sites in their company"
    ON sites FOR SELECT
    USING (company_id = get_user_company_id());

CREATE POLICY "Super admins can insert sites"
    ON sites FOR INSERT
    WITH CHECK (company_id = get_user_company_id() AND is_super_admin());

CREATE POLICY "Super admins can delete sites"
    ON sites FOR DELETE
    USING (company_id = get_user_company_id() AND is_super_admin());

CREATE POLICY "Site admins can update their sites"
    ON sites FOR UPDATE
    USING (
        company_id = get_user_company_id() AND (
            is_super_admin() OR
            (is_site_admin_or_above() AND id = get_user_site_id())
        )
    );

-- Partners 정책 (나중에 site_id 추가 후 업데이트됨)
CREATE POLICY "Users can view partners in their company"
    ON partners FOR SELECT
    USING (company_id = get_user_company_id());

CREATE POLICY "Site admins can insert partners"
    ON partners FOR INSERT
    WITH CHECK (company_id = get_user_company_id() AND is_site_admin_or_above());

CREATE POLICY "Site admins can update partners"
    ON partners FOR UPDATE
    USING (company_id = get_user_company_id() AND is_site_admin_or_above());

CREATE POLICY "Site admins can delete partners"
    ON partners FOR DELETE
    USING (company_id = get_user_company_id() AND is_site_admin_or_above());

-- Users 정책
CREATE POLICY "Users can view users based on role"
    ON users FOR SELECT
    USING (
        company_id = get_user_company_id() AND (
            is_super_admin() OR
            (is_site_admin_or_above() AND site_id = get_user_site_id()) OR
            (is_team_admin_or_above() AND partner_id = get_user_partner_id()) OR
            id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Site admins can update users in their site"
    ON users FOR UPDATE
    USING (
        company_id = get_user_company_id() AND (
            is_super_admin() OR
            (is_site_admin_or_above() AND site_id = get_user_site_id())
        )
    );

-- Attendance 정책
CREATE POLICY "Users can view attendance based on role"
    ON attendance FOR SELECT
    USING (
        site_id IN (SELECT id FROM sites WHERE company_id = get_user_company_id()) AND (
            is_super_admin() OR
            (is_site_admin_or_above() AND site_id = get_user_site_id()) OR
            (is_team_admin_or_above() AND partner_id = get_user_partner_id()) OR
            user_id = auth.uid()
        )
    );

CREATE POLICY "Team admins can insert attendance"
    ON attendance FOR INSERT
    WITH CHECK (
        is_team_admin_or_above() AND
        site_id IN (SELECT id FROM sites WHERE company_id = get_user_company_id())
    );

CREATE POLICY "Admins can update attendance based on role"
    ON attendance FOR UPDATE
    USING (
        site_id IN (SELECT id FROM sites WHERE company_id = get_user_company_id()) AND (
            is_super_admin() OR
            (is_site_admin_or_above() AND site_id = get_user_site_id()) OR
            (is_team_admin_or_above() AND partner_id = get_user_partner_id())
        )
    );

-- =============================================
-- 00003: client_profiles 테이블
-- =============================================

CREATE TABLE client_profiles (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    biz_num VARCHAR(12) NOT NULL UNIQUE,
    biz_file_url TEXT,
    industry_code VARCHAR(10),
    admin_info JSONB DEFAULT '{}'::jsonb,
    billing_info JSONB DEFAULT '{}'::jsonb,
    timezone VARCHAR(20) DEFAULT 'Asia/Seoul',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE client_profiles IS '회사 상세 프로필 (사업자 정보)';

CREATE INDEX idx_client_profiles_company ON client_profiles(company_id);
CREATE INDEX idx_client_profiles_biz_num ON client_profiles(biz_num);

CREATE TRIGGER update_client_profiles_updated_at
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 사업자번호 수정 방지 트리거
CREATE OR REPLACE FUNCTION prevent_biz_num_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.biz_num IS NOT NULL AND OLD.biz_num != NEW.biz_num THEN
        RAISE EXCEPTION '사업자등록번호는 수정할 수 없습니다.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_biz_num_change
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION prevent_biz_num_update();

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- is_admin 함수 (00004에서도 정의되지만 여기서 먼저 필요)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('SUPER_ADMIN', 'SITE_ADMIN') FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can view their company profile"
    ON client_profiles FOR SELECT
    USING (company_id = get_user_company_id());

CREATE POLICY "Admins can insert company profile"
    ON client_profiles FOR INSERT
    WITH CHECK (company_id = get_user_company_id() AND is_admin());

CREATE POLICY "Admins can update company profile"
    ON client_profiles FOR UPDATE
    USING (company_id = get_user_company_id() AND is_admin());

-- =============================================
-- 00004: partners에 site_id 추가
-- =============================================

ALTER TABLE partners
ADD COLUMN site_id BIGINT REFERENCES sites(id) ON DELETE CASCADE;

CREATE INDEX idx_partners_site ON partners(site_id);

COMMENT ON COLUMN partners.site_id IS '소속 현장 ID - NULL이면 회사 전체에 속한 팀';

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view partners in their company" ON partners;
DROP POLICY IF EXISTS "Site admins can insert partners" ON partners;
DROP POLICY IF EXISTS "Site admins can update partners" ON partners;
DROP POLICY IF EXISTS "Site admins can delete partners" ON partners;

CREATE POLICY "Users can view partners in their scope"
    ON partners FOR SELECT
    USING (
        company_id = get_user_company_id() AND (
            is_super_admin() OR
            site_id IS NULL OR
            site_id = get_user_site_id()
        )
    );

CREATE POLICY "Site admins can insert partners v2"
    ON partners FOR INSERT
    WITH CHECK (
        company_id = get_user_company_id() AND
        is_site_admin_or_above() AND (
            is_super_admin() OR
            site_id = get_user_site_id()
        )
    );

CREATE POLICY "Site admins can update partners v2"
    ON partners FOR UPDATE
    USING (
        company_id = get_user_company_id() AND
        is_site_admin_or_above() AND (
            is_super_admin() OR
            site_id = get_user_site_id()
        )
    );

CREATE POLICY "Site admins can delete partners v2"
    ON partners FOR DELETE
    USING (
        company_id = get_user_company_id() AND
        is_site_admin_or_above() AND (
            is_super_admin() OR
            site_id = get_user_site_id()
        )
    );

-- =============================================
-- 00005: 휴대폰 로그인 인증
-- =============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(100);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_unique'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_phone_unique UNIQUE (phone);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_agreed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketing_agreed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.phone IS '휴대폰 번호 - 로그인 ID로 사용 (UNIQUE)';
COMMENT ON COLUMN users.email IS '이메일 - 알림 및 비밀번호 재설정용 (선택)';

CREATE TABLE IF NOT EXISTS sms_verifications (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sms_verifications IS 'SMS 인증 코드 임시 저장';

CREATE INDEX IF NOT EXISTS idx_sms_verifications_phone ON sms_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_sms_verifications_expires ON sms_verifications(expires_at);

ALTER TABLE sms_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for sms_verifications"
    ON sms_verifications
    FOR ALL
    USING (false);

-- =============================================
-- 00006: 회사 테이블 확장
-- =============================================

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS ceo_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS address VARCHAR(500);

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS employee_count_range VARCHAR(20),
ADD COLUMN IF NOT EXISTS signup_source VARCHAR(50);

COMMENT ON COLUMN companies.ceo_name IS '대표자명 (필수)';
COMMENT ON COLUMN companies.address IS '본사 주소 (필수)';

ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS admin_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS admin_email VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS billing_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(100);

-- =============================================
-- 완료!
-- =============================================
