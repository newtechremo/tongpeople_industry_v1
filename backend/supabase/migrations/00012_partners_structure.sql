-- =============================================
-- 파트너 테이블 구조 개선
-- 협력사 여부, 업체명, 팀명 분리 저장
-- =============================================

-- 1. 컬럼 추가
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT FALSE,      -- 협력사 여부
ADD COLUMN IF NOT EXISTS company_name VARCHAR(100),             -- 업체명
ADD COLUMN IF NOT EXISTS team_name VARCHAR(100);                -- 팀명 (선택)

-- 2. 기존 데이터 마이그레이션
-- name이 "[협력사]"로 시작하는 경우 is_partner = TRUE
UPDATE partners
SET
  is_partner = (name LIKE '[협력사]%'),
  company_name = CASE
    WHEN name LIKE '[협력사]%' THEN TRIM(SUBSTRING(name FROM 6))  -- "[협력사] " 제거
    ELSE name
  END
WHERE company_name IS NULL;

-- 3. 코멘트
COMMENT ON COLUMN partners.is_partner IS '협력사 여부 (외부 업체)';
COMMENT ON COLUMN partners.company_name IS '업체명';
COMMENT ON COLUMN partners.team_name IS '팀명 (선택사항)';
