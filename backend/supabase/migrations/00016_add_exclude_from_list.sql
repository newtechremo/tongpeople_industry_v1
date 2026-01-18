-- 근로자 목록 제외 옵션 추가
-- 관리자나 대표가 근로자 목록에서 자신을 제외할 수 있는 옵션

ALTER TABLE users
ADD COLUMN IF NOT EXISTS exclude_from_list BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.exclude_from_list IS '근로자 목록 제외 여부: true면 근로자 관리 화면에서 숨김 (기본값: false)';

-- 기존 SUPER_ADMIN, SITE_ADMIN은 기본적으로 목록에서 제외 (선택 사항)
-- UPDATE users
-- SET exclude_from_list = true
-- WHERE role IN ('SUPER_ADMIN', 'SITE_ADMIN');
