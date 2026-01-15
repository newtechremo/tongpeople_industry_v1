-- =============================================
-- 00007: users 테이블에 status 필드 추가
-- 목적: 근로자 가입 상태를 세분화하여 관리
--       (PENDING, REQUESTED, ACTIVE, INACTIVE, BLOCKED)
-- =============================================

-- 1. status 필드 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'
CHECK (status IN ('PENDING', 'REQUESTED', 'ACTIVE', 'INACTIVE', 'BLOCKED'));

COMMENT ON COLUMN users.status IS '근로자 상태: PENDING(동의대기), REQUESTED(승인대기), ACTIVE(정상), INACTIVE(비활성), BLOCKED(차단)';

-- 2. 기존 데이터 마이그레이션 (is_active 기반)
UPDATE users SET status = CASE
  WHEN is_active = true THEN 'ACTIVE'
  WHEN is_active = false THEN 'INACTIVE'
  ELSE 'PENDING'
END
WHERE status IS NULL OR status = 'PENDING';

-- 3. 인덱스 추가 (status 필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 4. is_active 필드는 당분간 유지 (하위 호환)
-- 추후 마이그레이션에서 제거 예정:
-- ALTER TABLE users DROP COLUMN is_active;

-- =============================================
-- 롤백 스크립트 (필요시 별도 실행)
-- =============================================
-- DROP INDEX IF EXISTS idx_users_status;
-- ALTER TABLE users DROP COLUMN IF EXISTS status;
