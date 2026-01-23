-- Admin Worker Approval RPC Function
-- RLS를 우회하여 근로자 승인 처리

-- 근로자 승인 함수 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION admin_approve_worker(
  p_worker_id UUID,
  p_partner_id INTEGER,
  p_role TEXT,
  p_approved_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- 함수 소유자 권한으로 실행 (RLS 우회)
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_updated_count INTEGER;
BEGIN
  -- 근로자 상태를 ACTIVE로 업데이트
  UPDATE users
  SET
    status = 'ACTIVE',
    partner_id = p_partner_id,
    role = p_role,
    approved_at = NOW(),
    approved_by = p_approved_by,
    updated_at = NOW()
  WHERE id = p_worker_id
    AND status = 'REQUESTED';  -- REQUESTED 상태만 승인 가능

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '승인할 근로자를 찾을 수 없거나 이미 처리되었습니다.'
    );
  END IF;

  -- 업데이트된 근로자 정보 조회
  SELECT jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', id,
      'name', name,
      'phone', phone,
      'status', status,
      'role', role,
      'partner_id', partner_id,
      'approved_at', approved_at,
      'approved_by', approved_by
    )
  ) INTO v_result
  FROM users
  WHERE id = p_worker_id;

  RETURN v_result;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION admin_approve_worker(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_approve_worker(UUID, INTEGER, TEXT, UUID) TO service_role;

-- 코멘트 추가
COMMENT ON FUNCTION admin_approve_worker IS '관리자가 REQUESTED 상태의 근로자를 ACTIVE로 승인하는 함수. SECURITY DEFINER로 RLS를 우회합니다.';
