-- =============================================
-- 00014: P1 이슈 수정
-- 목적: QA에서 발견된 Critical 이슈 해결
-- 1. 트리거 동시성 문제 해결
-- 2. RLS 정책 구현
-- =============================================

-- =============================================
-- 1. 트리거 동시성 문제 해결
-- =============================================

-- 기존 함수 대체 (동시성 체크 추가)
CREATE OR REPLACE FUNCTION save_employment_history()
RETURNS TRIGGER AS $$
DECLARE
  existing_history INTEGER;
BEGIN
  -- users.status가 INACTIVE로 변경될 때만 이력 저장
  IF NEW.status = 'INACTIVE' AND OLD.status != 'INACTIVE' THEN

    -- 동시성 방지: 1분 이내에 이미 같은 유저의 이력이 생성되었는지 확인
    SELECT COUNT(*) INTO existing_history
    FROM user_employment_history
    WHERE user_id = OLD.id
      AND left_at > NOW() - INTERVAL '1 minute'
      AND company_id = OLD.company_id;

    -- 중복 이력이 없을 때만 새로 생성
    IF existing_history = 0 THEN
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
    ELSE
      -- 중복 방지 로그
      RAISE NOTICE '중복 이력 방지: user_id=%, 이미 1분 이내 이력 존재', OLD.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION save_employment_history() IS
  'users 테이블의 status가 INACTIVE로 변경될 때 자동으로 이력 저장 (동시성 보호)';

-- =============================================
-- 2. RLS 정책 구현
-- =============================================

-- RLS 활성화
ALTER TABLE user_employment_history ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인 이력은 누구나 조회 가능
CREATE POLICY "Users can view own history"
  ON user_employment_history
  FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON POLICY "Users can view own history" ON user_employment_history IS
  '근로자는 본인의 고용 이력만 조회 가능';

-- 정책 2: 관리자는 같은 회사 이력 조회 가능
CREATE POLICY "Admins can view company history"
  ON user_employment_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN')
        AND users.company_id = user_employment_history.company_id
    )
  );

COMMENT ON POLICY "Admins can view company history" ON user_employment_history IS
  '관리자는 같은 회사 소속 근로자의 이력 조회 가능';

-- 정책 3: 시스템 (트리거 함수)에서 자동 삽입 허용
CREATE POLICY "Allow system inserts"
  ON user_employment_history
  FOR INSERT
  WITH CHECK (true);

COMMENT ON POLICY "Allow system inserts" ON user_employment_history IS
  '트리거 함수에서 자동으로 이력 생성 허용';

-- 정책 4: 관리자는 이력 수정 불가 (UPDATE 금지)
-- UPDATE는 허용하지 않음 (이력은 불변)

-- 정책 5: 이력 삭제는 SUPER_ADMIN만 가능 (데이터 정리용)
CREATE POLICY "Only super admin can delete history"
  ON user_employment_history
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'SUPER_ADMIN'
    )
  );

COMMENT ON POLICY "Only super admin can delete history" ON user_employment_history IS
  'SUPER_ADMIN만 이력 삭제 가능 (데이터 정리용)';

-- =============================================
-- 검증 쿼리 (테스트용)
-- =============================================

-- RLS 정책 확인
-- SELECT * FROM pg_policies WHERE tablename = 'user_employment_history';

-- 트리거 함수 확인
-- SELECT prosrc FROM pg_proc WHERE proname = 'save_employment_history';

-- =============================================
-- 롤백 스크립트 (필요시)
-- =============================================
-- DROP POLICY IF EXISTS "Only super admin can delete history" ON user_employment_history;
-- DROP POLICY IF EXISTS "Allow system inserts" ON user_employment_history;
-- DROP POLICY IF EXISTS "Admins can view company history" ON user_employment_history;
-- DROP POLICY IF EXISTS "Users can view own history" ON user_employment_history;
-- ALTER TABLE user_employment_history DISABLE ROW LEVEL SECURITY;
