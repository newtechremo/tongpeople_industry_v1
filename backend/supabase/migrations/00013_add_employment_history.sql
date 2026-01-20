-- =============================================
-- 00013: 근로자 이력 관리 시스템 (방안 1)
-- 목적: 이직 시 과거 소속 이력 보존
-- 전략: 메인 테이블(users)은 현재 소속만, 이력 테이블로 과거 보존
-- =============================================

-- 1. 퇴사 사유 ENUM 타입 정의
CREATE TYPE leave_reason AS ENUM ('RESIGNED', 'TRANSFERRED', 'FIRED');

COMMENT ON TYPE leave_reason IS '퇴사 사유: RESIGNED(자진퇴사), TRANSFERRED(이직), FIRED(해고)';

-- 2. 이력 테이블 생성
CREATE TABLE user_employment_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 과거 소속 정보
  company_id BIGINT NOT NULL REFERENCES companies(id),
  site_id BIGINT NOT NULL REFERENCES sites(id),
  partner_id BIGINT NOT NULL REFERENCES partners(id),
  role user_role NOT NULL,

  -- 이력 정보
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ NOT NULL,
  leave_reason leave_reason,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)  -- 처리한 관리자
);

COMMENT ON TABLE user_employment_history IS '근로자 고용 이력';
COMMENT ON COLUMN user_employment_history.joined_at IS '입사일 (최초 가입일)';
COMMENT ON COLUMN user_employment_history.left_at IS '퇴사일 (INACTIVE 전환일)';
COMMENT ON COLUMN user_employment_history.leave_reason IS '퇴사 사유';

-- 3. 인덱스 생성
CREATE INDEX idx_employment_history_user ON user_employment_history(user_id);
CREATE INDEX idx_employment_history_left_at ON user_employment_history(left_at);
CREATE INDEX idx_employment_history_company ON user_employment_history(company_id);

-- 4. 자동 이력 생성 트리거 함수
CREATE OR REPLACE FUNCTION save_employment_history()
RETURNS TRIGGER AS $$
BEGIN
  -- users.status가 INACTIVE로 변경될 때만 이력 저장
  IF NEW.status = 'INACTIVE' AND OLD.status != 'INACTIVE' THEN
    INSERT INTO user_employment_history (
      user_id,
      company_id,
      site_id,
      partner_id,
      role,
      joined_at,
      left_at,
      leave_reason,
      created_by
    ) VALUES (
      OLD.id,
      OLD.company_id,
      OLD.site_id,
      OLD.partner_id,
      OLD.role,
      COALESCE(OLD.created_at, NOW()),
      NOW(),
      'RESIGNED',  -- 기본값 (Edge Function에서 수정 가능)
      NULL  -- created_by는 Edge Function에서 설정
    );

    -- 로그 출력
    RAISE NOTICE '고용 이력 저장: user_id=%, company_id=%, left_at=%',
      OLD.id, OLD.company_id, NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION save_employment_history() IS 'users 테이블의 status가 INACTIVE로 변경될 때 자동으로 이력 저장';

-- 5. 트리거 생성
CREATE TRIGGER trigger_save_employment_history
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION save_employment_history();

COMMENT ON TRIGGER trigger_save_employment_history ON users IS 'INACTIVE 전환 시 자동으로 고용 이력 저장';

-- =============================================
-- 롤백 스크립트 (필요시 별도 실행)
-- =============================================
-- DROP TRIGGER IF EXISTS trigger_save_employment_history ON users;
-- DROP FUNCTION IF EXISTS save_employment_history();
-- DROP INDEX IF EXISTS idx_employment_history_company;
-- DROP INDEX IF EXISTS idx_employment_history_left_at;
-- DROP INDEX IF EXISTS idx_employment_history_user;
-- DROP TABLE IF EXISTS user_employment_history;
-- DROP TYPE IF EXISTS leave_reason;
