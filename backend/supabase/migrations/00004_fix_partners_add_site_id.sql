-- =============================================
-- partners 테이블에 site_id 추가 마이그레이션
-- 현장별 팀(업체) 관리를 위해 필요
-- =============================================

-- 1. site_id 컬럼 추가
ALTER TABLE partners
ADD COLUMN site_id BIGINT REFERENCES sites(id) ON DELETE CASCADE;

-- 2. 인덱스 추가
CREATE INDEX idx_partners_site ON partners(site_id);

-- 3. 코멘트 추가
COMMENT ON COLUMN partners.site_id IS '소속 현장 ID - NULL이면 회사 전체에 속한 팀';

-- =============================================
-- is_admin() 함수 추가
-- client_profiles RLS 정책에서 사용
-- =============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('SUPER_ADMIN', 'SITE_ADMIN') FROM users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS '현장 관리자 이상 권한 체크 (SUPER_ADMIN, SITE_ADMIN)';

-- =============================================
-- partners RLS 정책 업데이트
-- 현장 관리자는 자기 현장의 팀만 관리 가능
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view partners in their company" ON partners;
DROP POLICY IF EXISTS "Site admins can insert partners" ON partners;
DROP POLICY IF EXISTS "Site admins can update partners" ON partners;
DROP POLICY IF EXISTS "Site admins can delete partners" ON partners;

-- 새 정책: 조회 - 같은 회사 또는 같은 현장의 팀 조회 가능
CREATE POLICY "Users can view partners in their scope"
    ON partners FOR SELECT
    USING (
        company_id = get_user_company_id() AND (
            is_super_admin() OR
            site_id IS NULL OR  -- 회사 전체 팀은 모든 직원 조회 가능
            site_id = get_user_site_id()
        )
    );

-- 새 정책: 삽입 - 현장 관리자 이상만 팀 추가 가능
CREATE POLICY "Site admins can insert partners"
    ON partners FOR INSERT
    WITH CHECK (
        company_id = get_user_company_id() AND
        is_site_admin_or_above() AND (
            is_super_admin() OR  -- 최고 관리자는 모든 현장에 팀 추가 가능
            site_id = get_user_site_id()  -- 현장 관리자는 자기 현장에만
        )
    );

-- 새 정책: 수정 - 현장 관리자 이상만 팀 수정 가능
CREATE POLICY "Site admins can update partners"
    ON partners FOR UPDATE
    USING (
        company_id = get_user_company_id() AND
        is_site_admin_or_above() AND (
            is_super_admin() OR
            site_id = get_user_site_id()
        )
    );

-- 새 정책: 삭제 - 현장 관리자 이상만 팀 삭제 가능
CREATE POLICY "Site admins can delete partners"
    ON partners FOR DELETE
    USING (
        company_id = get_user_company_id() AND
        is_site_admin_or_above() AND (
            is_super_admin() OR
            site_id = get_user_site_id()
        )
    );
