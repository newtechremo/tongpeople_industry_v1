-- =============================================
-- 00015: RLS 정책 수정 - 크로스 컴퍼니 삭제 방지
-- 목적: QA P1 이슈 해결
-- 문제: SUPER_ADMIN이 다른 회사 이력을 삭제할 수 있음
-- 해결: 회사 제약 추가
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Only super admin can delete history" ON user_employment_history;

-- 새 정책 생성 (회사 제약 추가)
CREATE POLICY "Only super admin can delete company history"
  ON user_employment_history
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'SUPER_ADMIN'
        AND users.company_id = user_employment_history.company_id
    )
  );

COMMENT ON POLICY "Only super admin can delete company history" ON user_employment_history IS
  'SUPER_ADMIN이 자기 회사 이력만 삭제 가능 (크로스 컴퍼니 차단)';

-- =============================================
-- 검증 쿼리 (테스트용)
-- =============================================

-- RLS 정책 확인
-- SELECT * FROM pg_policies WHERE tablename = 'user_employment_history';

-- =============================================
-- 롤백 스크립트 (필요시)
-- =============================================
-- DROP POLICY IF EXISTS "Only super admin can delete company history" ON user_employment_history;
--
-- CREATE POLICY "Only super admin can delete history"
--   ON user_employment_history
--   FOR DELETE
--   USING (
--     EXISTS (
--       SELECT 1 FROM users
--       WHERE users.id = auth.uid()
--         AND users.role = 'SUPER_ADMIN'
--     )
--   );
