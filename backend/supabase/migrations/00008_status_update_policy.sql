-- =============================================
-- 00008: status 필드 업데이트 제한 정책
-- 목적: 근로자가 본인 status를 직접 변경하지 못하도록 제한
-- =============================================

-- 1. status 변경 권한 확인 함수
CREATE OR REPLACE FUNCTION can_update_user_status(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role user_role;
BEGIN
    -- 현재 사용자의 역할 조회
    SELECT role INTO current_user_role FROM users WHERE id = auth.uid();

    -- 관리자(SUPER_ADMIN, SITE_ADMIN)만 status 변경 가능
    IF current_user_role IN ('SUPER_ADMIN', 'SITE_ADMIN') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. status 변경 시 권한 검증 트리거 함수
CREATE OR REPLACE FUNCTION check_status_update()
RETURNS TRIGGER AS $$
BEGIN
    -- status가 변경되었는지 확인
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- 관리자가 아니면 status 변경 불가
        IF NOT can_update_user_status(NEW.id) THEN
            -- status를 원래 값으로 되돌림 (에러 대신 무시)
            NEW.status := OLD.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 생성 (기존 트리거가 있으면 삭제 후 생성)
DROP TRIGGER IF EXISTS trigger_check_status_update ON users;

CREATE TRIGGER trigger_check_status_update
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_status_update();

COMMENT ON FUNCTION can_update_user_status IS 'status 변경 권한 확인: SUPER_ADMIN, SITE_ADMIN만 가능';
COMMENT ON FUNCTION check_status_update IS 'status 변경 시 권한 검증 트리거';

-- =============================================
-- 롤백 스크립트 (필요시 별도 실행)
-- =============================================
-- DROP TRIGGER IF EXISTS trigger_check_status_update ON users;
-- DROP FUNCTION IF EXISTS check_status_update();
-- DROP FUNCTION IF EXISTS can_update_user_status(UUID);
