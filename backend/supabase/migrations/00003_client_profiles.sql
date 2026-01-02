-- =============================================
-- client_profiles 테이블 (회사 상세 프로필)
-- =============================================

CREATE TABLE client_profiles (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,

    -- 사업자 정보
    biz_num VARCHAR(12) NOT NULL UNIQUE,          -- 사업자등록번호 (XXX-XX-XXXXX)
    biz_file_url TEXT,                            -- 사업자 등록증 파일 스토리지 경로
    industry_code VARCHAR(10),                    -- 10차 업종코드

    -- 담당자 정보 (JSON)
    admin_info JSONB DEFAULT '{}'::jsonb,         -- 전산관리자 정보 {name, phone, email}
    billing_info JSONB DEFAULT '{}'::jsonb,       -- 결제담당자 정보 {name, phone, email}

    -- 설정
    timezone VARCHAR(20) DEFAULT 'Asia/Seoul',    -- 기본 시간대

    -- 메타
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE client_profiles IS '회사 상세 프로필 (사업자 정보)';
COMMENT ON COLUMN client_profiles.biz_num IS '사업자등록번호 - 최초 등록 후 수정 불가';
COMMENT ON COLUMN client_profiles.industry_code IS '10차 대분류 업종코드 (예: F - 건설업)';
COMMENT ON COLUMN client_profiles.admin_info IS '전산관리자 정보 JSON: {name, phone, email}';
COMMENT ON COLUMN client_profiles.billing_info IS '결제담당자 정보 JSON: {name, phone, email}';

-- 인덱스
CREATE INDEX idx_client_profiles_company ON client_profiles(company_id);
CREATE INDEX idx_client_profiles_biz_num ON client_profiles(biz_num);

-- Updated_at 트리거
CREATE TRIGGER update_client_profiles_updated_at
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 사업자번호 수정 방지 트리거
-- =============================================
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

-- =============================================
-- RLS 정책
-- =============================================
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- 같은 회사의 프로필만 조회 가능
CREATE POLICY "Users can view their company profile"
    ON client_profiles FOR SELECT
    USING (company_id = get_user_company_id());

-- 관리자만 프로필 생성 가능
CREATE POLICY "Admins can insert company profile"
    ON client_profiles FOR INSERT
    WITH CHECK (company_id = get_user_company_id() AND is_admin());

-- 관리자만 프로필 수정 가능 (사업자번호 제외 - 트리거로 방지)
CREATE POLICY "Admins can update company profile"
    ON client_profiles FOR UPDATE
    USING (company_id = get_user_company_id() AND is_admin());

-- =============================================
-- Storage 버킷 (사업자등록증 이미지용)
-- =============================================
-- Supabase Dashboard에서 'business-licenses' 버킷 생성 필요
-- 또는 아래 SQL 실행:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('business-licenses', 'business-licenses', false);
