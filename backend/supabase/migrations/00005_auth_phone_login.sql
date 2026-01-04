-- =============================================
-- 휴대폰 로그인 인증 시스템 확장
-- 휴대폰 번호를 로그인 ID로 사용
-- =============================================

-- 1. users 테이블에 email 컬럼 추가 (알림용, 선택)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- 2. phone 컬럼에 UNIQUE 제약조건 추가 (로그인 ID로 사용)
-- 기존 데이터가 있을 경우를 대비해 조건부로 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_unique'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_phone_unique UNIQUE (phone);
    END IF;
END $$;

-- 3. phone 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 4. 약관 동의 여부 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_agreed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketing_agreed BOOLEAN DEFAULT FALSE;

-- 5. 코멘트 추가
COMMENT ON COLUMN users.phone IS '휴대폰 번호 - 로그인 ID로 사용 (UNIQUE)';
COMMENT ON COLUMN users.email IS '이메일 - 알림 및 비밀번호 재설정용 (선택)';
COMMENT ON COLUMN users.terms_agreed_at IS '이용약관 동의 일시';
COMMENT ON COLUMN users.privacy_agreed_at IS '개인정보처리방침 동의 일시';
COMMENT ON COLUMN users.marketing_agreed IS '마케팅 정보 수신 동의 여부';

-- =============================================
-- SMS 인증 코드 저장 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS sms_verifications (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL,  -- SIGNUP, LOGIN, PASSWORD_RESET
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,     -- 시도 횟수 (3회 제한)
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sms_verifications IS 'SMS 인증 코드 임시 저장';
COMMENT ON COLUMN sms_verifications.purpose IS '인증 목적: SIGNUP, LOGIN, PASSWORD_RESET';
COMMENT ON COLUMN sms_verifications.attempts IS '인증 시도 횟수 (3회 초과 시 재발송 필요)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sms_verifications_phone ON sms_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_sms_verifications_expires ON sms_verifications(expires_at);

-- 만료된 코드 자동 삭제 (5분 후)
-- Supabase에서는 pg_cron을 사용하거나 수동으로 정리
-- 여기서는 expires_at으로 조회 시 필터링

-- =============================================
-- RLS 정책 (sms_verifications)
-- =============================================
ALTER TABLE sms_verifications ENABLE ROW LEVEL SECURITY;

-- 인증 테이블은 Service Role만 접근 가능 (Edge Functions에서 사용)
-- 일반 사용자는 접근 불가
CREATE POLICY "Service role only for sms_verifications"
    ON sms_verifications
    FOR ALL
    USING (false);  -- 모든 접근 차단 (service_role은 RLS 우회)
