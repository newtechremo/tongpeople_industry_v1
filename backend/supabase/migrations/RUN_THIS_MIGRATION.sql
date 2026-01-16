-- =============================================
-- 필수 마이그레이션 - 이 SQL을 Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. 회사 테이블에 업종코드 컬럼 추가
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS business_category_code VARCHAR(10),   -- 업종코드 (예: F)
ADD COLUMN IF NOT EXISTS business_category_name VARCHAR(100);  -- 업종명 (예: 건설업)

COMMENT ON COLUMN companies.business_category_code IS '대표 업종코드 (10차 대분류 기준)';
COMMENT ON COLUMN companies.business_category_name IS '대표 업종명';

-- 2. 파트너 테이블에 협력사 구조 컬럼 추가
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT FALSE,      -- 협력사 여부
ADD COLUMN IF NOT EXISTS company_name VARCHAR(100),             -- 업체명
ADD COLUMN IF NOT EXISTS team_name VARCHAR(100);                -- 팀명 (선택)

-- 기존 데이터 마이그레이션
UPDATE partners
SET
  is_partner = (name LIKE '[협력사]%' OR name LIKE '%협력사%'),
  company_name = CASE
    WHEN name LIKE '[협력사]%' THEN TRIM(SUBSTRING(name FROM POSITION(']' IN name) + 1))
    ELSE name
  END
WHERE company_name IS NULL;

COMMENT ON COLUMN partners.is_partner IS '협력사 여부 (외부 업체)';
COMMENT ON COLUMN partners.company_name IS '업체명';
COMMENT ON COLUMN partners.team_name IS '팀명 (선택사항)';
