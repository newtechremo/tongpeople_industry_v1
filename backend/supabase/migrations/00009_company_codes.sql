-- =============================================
-- 회사 코드 테이블 생성
-- 근로자 앱에서 회사코드 입력을 통한 가입 지원
-- =============================================

-- 1. 회사 코드 테이블 생성
CREATE TABLE company_codes (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,

  CONSTRAINT valid_code_format CHECK (code ~ '^[A-Z0-9]{6}$')
);

-- 2. 인덱스 생성
CREATE INDEX idx_company_codes_company ON company_codes(company_id);
CREATE INDEX idx_company_codes_code ON company_codes(code) WHERE is_active = TRUE;

-- 3. 코멘트
COMMENT ON TABLE company_codes IS '회사 코드 테이블 - 근로자 앱 가입용';
COMMENT ON COLUMN company_codes.id IS '기본 키';
COMMENT ON COLUMN company_codes.company_id IS '회사 ID (FK)';
COMMENT ON COLUMN company_codes.code IS '6자리 회사 코드 (영문 대문자 + 숫자)';
COMMENT ON COLUMN company_codes.is_active IS '활성화 여부';
COMMENT ON COLUMN company_codes.created_at IS '생성 일시';
COMMENT ON COLUMN company_codes.deactivated_at IS '비활성화 일시';

-- =============================================
-- 회사 코드 생성 함수
-- =============================================

-- 4. 랜덤 회사 코드 생성 함수 (6자리 영문 대문자 + 숫자)
CREATE OR REPLACE FUNCTION generate_company_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. 중복 검사 포함 유니크 회사 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_unique_company_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  new_code VARCHAR(6);
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  LOOP
    new_code := generate_company_code();

    -- 중복 검사
    IF NOT EXISTS (SELECT 1 FROM company_codes WHERE code = new_code) THEN
      RETURN new_code;
    END IF;

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique company code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. 회사에 코드 생성 및 할당 함수
CREATE OR REPLACE FUNCTION create_company_code(p_company_id BIGINT)
RETURNS VARCHAR(6) AS $$
DECLARE
  new_code VARCHAR(6);
BEGIN
  -- 회사 존재 여부 확인
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company_id) THEN
    RAISE EXCEPTION 'Company with id % does not exist', p_company_id;
  END IF;

  -- 유니크 코드 생성
  new_code := generate_unique_company_code();

  -- 코드 삽입
  INSERT INTO company_codes (company_id, code, is_active, created_at)
  VALUES (p_company_id, new_code, TRUE, NOW());

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 7. 회사 코드 비활성화 함수
CREATE OR REPLACE FUNCTION deactivate_company_code(p_code VARCHAR(6))
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE company_codes
  SET is_active = FALSE, deactivated_at = NOW()
  WHERE code = p_code AND is_active = TRUE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 8. 회사 코드로 회사 조회 함수
CREATE OR REPLACE FUNCTION get_company_by_code(p_code VARCHAR(6))
RETURNS TABLE (
  company_id BIGINT,
  company_name VARCHAR,
  code VARCHAR(6),
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS company_id,
    c.name AS company_name,
    cc.code,
    cc.is_active
  FROM company_codes cc
  JOIN companies c ON c.id = cc.company_id
  WHERE cc.code = p_code AND cc.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 기존 회사에 초기 코드 생성
-- =============================================

-- 9. 기존 회사들에 대해 초기 코드 생성
DO $$
DECLARE
  company_record RECORD;
BEGIN
  FOR company_record IN
    SELECT id FROM companies
    WHERE id NOT IN (SELECT company_id FROM company_codes)
  LOOP
    PERFORM create_company_code(company_record.id);
  END LOOP;
END;
$$;

-- =============================================
-- RLS 정책
-- =============================================

-- 10. RLS 활성화
ALTER TABLE company_codes ENABLE ROW LEVEL SECURITY;

-- 11. 회사 코드 조회 정책 (모든 인증된 사용자 - 가입 시 코드 검증용)
CREATE POLICY "Anyone can lookup active company codes"
  ON company_codes
  FOR SELECT
  USING (is_active = TRUE);

-- 12. 회사 코드 생성/수정 정책 (SUPER_ADMIN, SITE_ADMIN만)
CREATE POLICY "Admins can manage company codes"
  ON company_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('SUPER_ADMIN', 'SITE_ADMIN')
      AND u.company_id = company_codes.company_id
    )
  );

-- =============================================
-- 새 회사 생성 시 자동 코드 생성 트리거
-- =============================================

-- 13. 트리거 함수
CREATE OR REPLACE FUNCTION auto_create_company_code()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_company_code(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. 트리거 생성
CREATE TRIGGER trigger_auto_create_company_code
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_company_code();
