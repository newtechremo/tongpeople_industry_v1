-- =============================================
-- 회사 테이블에 업종코드 컬럼 추가
-- =============================================

-- 1. 업종코드 컬럼 추가
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS business_category_code VARCHAR(10),   -- 업종코드 (예: F)
ADD COLUMN IF NOT EXISTS business_category_name VARCHAR(100);  -- 업종명 (예: 건설업)

-- 2. 코멘트
COMMENT ON COLUMN companies.business_category_code IS '대표 업종코드 (10차 대분류 기준)';
COMMENT ON COLUMN companies.business_category_name IS '대표 업종명';
