-- =============================================
-- 회사 테이블 확장 (AUTH-PROCESS Step 2에 따름)
-- 최초 관리자 가입 시 필수 정보 추가
-- =============================================

-- 1. 회사 필수 정보 추가
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS ceo_name VARCHAR(50),           -- 대표자명
ADD COLUMN IF NOT EXISTS address VARCHAR(500);           -- 본사 주소

-- 2. 회사 선택 정보 추가
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS employee_count_range VARCHAR(20),  -- 직원 수 범위
ADD COLUMN IF NOT EXISTS signup_source VARCHAR(50);         -- 가입 경로

-- 3. 코멘트
COMMENT ON COLUMN companies.ceo_name IS '대표자명 (필수)';
COMMENT ON COLUMN companies.address IS '본사 주소 (필수)';
COMMENT ON COLUMN companies.employee_count_range IS '직원 수 범위: 5_UNDER, 5_49, 50_299, 300_OVER, OTHER';
COMMENT ON COLUMN companies.signup_source IS '가입 경로 (마케팅 분석용)';

-- =============================================
-- client_profiles 테이블과의 관계 정리
--
-- companies: 기본 회사 정보 (가입 시 필수)
-- client_profiles: 상세 프로필 (가입 후 설정에서 입력)
-- =============================================

-- client_profiles 테이블에 추가 정보 컬럼 확장
ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS admin_name VARCHAR(50),         -- 전산관리자 이름
ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(20),        -- 전산관리자 연락처
ADD COLUMN IF NOT EXISTS admin_email VARCHAR(100),       -- 전산관리자 이메일
ADD COLUMN IF NOT EXISTS billing_name VARCHAR(50),       -- 결제담당자 이름
ADD COLUMN IF NOT EXISTS billing_phone VARCHAR(20),      -- 결제담당자 연락처
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(100);     -- 결제담당자 이메일

COMMENT ON COLUMN client_profiles.admin_name IS '전산관리자 이름';
COMMENT ON COLUMN client_profiles.admin_phone IS '전산관리자 연락처';
COMMENT ON COLUMN client_profiles.admin_email IS '전산관리자 이메일';
COMMENT ON COLUMN client_profiles.billing_name IS '결제담당자 이름';
COMMENT ON COLUMN client_profiles.billing_phone IS '결제담당자 연락처';
COMMENT ON COLUMN client_profiles.billing_email IS '결제담당자 이메일';
