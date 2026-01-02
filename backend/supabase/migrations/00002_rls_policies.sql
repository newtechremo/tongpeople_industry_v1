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
-- 사용자 역할 확인 함수들
-- =============================================
-- 최고 관리자 여부
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'SUPER_ADMIN' FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현장 관리자 이상 여부 (SUPER_ADMIN, SITE_ADMIN)
CREATE OR REPLACE FUNCTION is_site_admin_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('SUPER_ADMIN', 'SITE_ADMIN') FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 팀 관리자 이상 여부 (SUPER_ADMIN, SITE_ADMIN, TEAM_ADMIN)
CREATE OR REPLACE FUNCTION is_team_admin_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN') FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자의 현장 ID 가져오기
CREATE OR REPLACE FUNCTION get_user_site_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT site_id FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자의 팀(협력업체) ID 가져오기
CREATE OR REPLACE FUNCTION get_user_partner_id()
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT partner_id FROM users WHERE id = auth.uid()
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

-- 최고 관리자만 수정 가능
CREATE POLICY "Super admins can update their company"
    ON companies FOR UPDATE
    USING (id = get_user_company_id() AND is_super_admin());

-- =============================================
-- Sites 정책
-- =============================================
-- 같은 회사의 현장만 조회 가능
CREATE POLICY "Users can view sites in their company"
    ON sites FOR SELECT
    USING (company_id = get_user_company_id());

-- 최고 관리자만 현장 추가/삭제 가능
CREATE POLICY "Super admins can insert sites"
    ON sites FOR INSERT
    WITH CHECK (company_id = get_user_company_id() AND is_super_admin());

CREATE POLICY "Super admins can delete sites"
    ON sites FOR DELETE
    USING (company_id = get_user_company_id() AND is_super_admin());

-- 현장 관리자 이상은 현장 설정 수정 가능
CREATE POLICY "Site admins can update their sites"
    ON sites FOR UPDATE
    USING (
        company_id = get_user_company_id() AND (
            is_super_admin() OR
            (is_site_admin_or_above() AND id = get_user_site_id())
        )
    );

-- =============================================
-- Partners (팀/업체) 정책
-- =============================================
-- 같은 회사의 팀만 조회 가능
CREATE POLICY "Users can view partners in their company"
    ON partners FOR SELECT
    USING (company_id = get_user_company_id());

-- 현장 관리자 이상만 팀 추가/수정/삭제 가능
CREATE POLICY "Site admins can insert partners"
    ON partners FOR INSERT
    WITH CHECK (company_id = get_user_company_id() AND is_site_admin_or_above());

CREATE POLICY "Site admins can update partners"
    ON partners FOR UPDATE
    USING (company_id = get_user_company_id() AND is_site_admin_or_above());

CREATE POLICY "Site admins can delete partners"
    ON partners FOR DELETE
    USING (company_id = get_user_company_id() AND is_site_admin_or_above());

-- =============================================
-- Users 정책
-- =============================================
-- 팀 관리자: 본인 팀원만 조회
-- 현장 관리자: 본인 현장 전체 조회
-- 최고 관리자: 회사 전체 조회
CREATE POLICY "Users can view users based on role"
    ON users FOR SELECT
    USING (
        company_id = get_user_company_id() AND (
            is_super_admin() OR
            (is_site_admin_or_above() AND site_id = get_user_site_id()) OR
            (is_team_admin_or_above() AND partner_id = get_user_partner_id()) OR
            id = auth.uid()  -- 본인은 항상 조회 가능
        )
    );

-- 자신의 정보는 본인이 수정 가능
CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- 현장 관리자 이상은 같은 현장 사용자 정보 수정 가능
CREATE POLICY "Site admins can update users in their site"
    ON users FOR UPDATE
    USING (
        company_id = get_user_company_id() AND (
            is_super_admin() OR
            (is_site_admin_or_above() AND site_id = get_user_site_id())
        )
    );

-- =============================================
-- Attendance 정책
-- =============================================
-- 역할별 출퇴근 기록 조회
-- 최고 관리자: 회사 전체
-- 현장 관리자: 본인 현장 전체
-- 팀 관리자: 본인 팀 전체
-- 근로자: 본인 기록만
CREATE POLICY "Users can view attendance based on role"
    ON attendance FOR SELECT
    USING (
        site_id IN (SELECT id FROM sites WHERE company_id = get_user_company_id()) AND (
            is_super_admin() OR
            (is_site_admin_or_above() AND site_id = get_user_site_id()) OR
            (is_team_admin_or_above() AND partner_id = get_user_partner_id()) OR
            user_id = auth.uid()  -- 본인 기록은 항상 조회 가능
        )
    );

-- 팀 관리자 이상이 출퇴근 기록 생성 가능 (QR 스캔)
CREATE POLICY "Team admins can insert attendance"
    ON attendance FOR INSERT
    WITH CHECK (
        is_team_admin_or_above() AND
        site_id IN (SELECT id FROM sites WHERE company_id = get_user_company_id())
    );

-- 역할별 출퇴근 기록 수정
-- 팀 관리자: 본인 팀원 기록 수정 가능
-- 현장 관리자 이상: 현장 전체 수정 가능
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
-- Service Role 전용 정책 (서버 사이드용)
-- =============================================
-- service_role은 모든 테이블에 접근 가능 (Supabase 기본 동작)
