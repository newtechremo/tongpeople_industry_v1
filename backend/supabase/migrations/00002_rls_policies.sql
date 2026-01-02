-- =============================================
-- Row Level Security (RLS) 정책
-- =============================================

-- RLS 활성화
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 사용자의 회사 ID 가져오기 함수
-- =============================================
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT company_id FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 사용자가 관리자인지 확인하는 함수
-- =============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = '관리자' FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Companies 정책
-- =============================================
-- 자신의 회사만 조회 가능
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    USING (id = get_user_company_id());

-- 관리자만 수정 가능
CREATE POLICY "Admins can update their company"
    ON companies FOR UPDATE
    USING (id = get_user_company_id() AND is_admin());

-- =============================================
-- Sites 정책
-- =============================================
-- 같은 회사의 현장만 조회 가능
CREATE POLICY "Users can view sites in their company"
    ON sites FOR SELECT
    USING (company_id = get_user_company_id());

-- 관리자만 현장 추가/수정/삭제 가능
CREATE POLICY "Admins can insert sites"
    ON sites FOR INSERT
    WITH CHECK (company_id = get_user_company_id() AND is_admin());

CREATE POLICY "Admins can update sites"
    ON sites FOR UPDATE
    USING (company_id = get_user_company_id() AND is_admin());

CREATE POLICY "Admins can delete sites"
    ON sites FOR DELETE
    USING (company_id = get_user_company_id() AND is_admin());

-- =============================================
-- Partners 정책
-- =============================================
-- 같은 회사의 협력업체만 조회 가능
CREATE POLICY "Users can view partners in their company"
    ON partners FOR SELECT
    USING (company_id = get_user_company_id());

-- 관리자만 협력업체 추가/수정/삭제 가능
CREATE POLICY "Admins can insert partners"
    ON partners FOR INSERT
    WITH CHECK (company_id = get_user_company_id() AND is_admin());

CREATE POLICY "Admins can update partners"
    ON partners FOR UPDATE
    USING (company_id = get_user_company_id() AND is_admin());

CREATE POLICY "Admins can delete partners"
    ON partners FOR DELETE
    USING (company_id = get_user_company_id() AND is_admin());

-- =============================================
-- Users 정책
-- =============================================
-- 같은 회사의 사용자만 조회 가능
CREATE POLICY "Users can view users in their company"
    ON users FOR SELECT
    USING (company_id = get_user_company_id());

-- 자신의 정보는 본인이 수정 가능
CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- 관리자는 같은 회사 사용자 정보 수정 가능
CREATE POLICY "Admins can update users in their company"
    ON users FOR UPDATE
    USING (company_id = get_user_company_id() AND is_admin());

-- =============================================
-- Attendance 정책
-- =============================================
-- 같은 회사의 출퇴근 기록 조회 가능
CREATE POLICY "Users can view attendance in their company sites"
    ON attendance FOR SELECT
    USING (
        site_id IN (
            SELECT id FROM sites WHERE company_id = get_user_company_id()
        )
    );

-- 자신의 출퇴근 기록 생성 가능
CREATE POLICY "Users can insert their own attendance"
    ON attendance FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 자신의 출퇴근 기록 또는 관리자가 수정 가능
CREATE POLICY "Users can update their own attendance or admins can update any"
    ON attendance FOR UPDATE
    USING (
        user_id = auth.uid() OR
        (is_admin() AND site_id IN (
            SELECT id FROM sites WHERE company_id = get_user_company_id()
        ))
    );

-- =============================================
-- Service Role 전용 정책 (서버 사이드용)
-- =============================================
-- service_role은 모든 테이블에 접근 가능 (Supabase 기본 동작)
