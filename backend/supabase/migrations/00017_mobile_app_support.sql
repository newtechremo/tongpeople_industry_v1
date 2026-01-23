-- =============================================
-- TongPassApp 모바일 앱 지원을 위한 스키마 확장
-- JWT 리프레시 토큰, 약관 동의 기록 등
-- =============================================

-- 1. 리프레시 토큰 테이블 (JWT 토큰 갱신용)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_info TEXT,  -- 디바이스 정보 (선택)
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ  -- 토큰 폐기 시간
);

COMMENT ON TABLE refresh_tokens IS '리프레시 토큰 저장 (JWT 갱신용)';
COMMENT ON COLUMN refresh_tokens.user_id IS '사용자 ID (FK)';
COMMENT ON COLUMN refresh_tokens.token IS '리프레시 토큰 값';
COMMENT ON COLUMN refresh_tokens.device_info IS '디바이스 정보 (User-Agent 등)';
COMMENT ON COLUMN refresh_tokens.expires_at IS '토큰 만료 시간';
COMMENT ON COLUMN refresh_tokens.revoked_at IS '토큰 폐기 시간 (로그아웃 시)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- RLS 정책
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Service Role만 접근 가능 (Edge Functions에서 사용)
CREATE POLICY "Service role only for refresh_tokens"
    ON refresh_tokens
    FOR ALL
    USING (false);

-- =============================================
-- 2. 약관 동의 기록 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS term_agreements (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    term_type VARCHAR(50) NOT NULL,  -- terms, privacy, third_party, location, marketing
    agreed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),  -- 동의 시 IP (선택)

    UNIQUE(user_id, term_type)
);

COMMENT ON TABLE term_agreements IS '약관 동의 기록';
COMMENT ON COLUMN term_agreements.term_type IS '약관 유형: terms(이용약관), privacy(개인정보), third_party(제3자제공), location(위치기반), marketing(마케팅)';
COMMENT ON COLUMN term_agreements.agreed_at IS '동의 일시';
COMMENT ON COLUMN term_agreements.ip_address IS '동의 시 클라이언트 IP';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_term_agreements_user ON term_agreements(user_id);

-- RLS 정책
ALTER TABLE term_agreements ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 약관 동의 기록만 조회 가능
CREATE POLICY "Users can view own term agreements"
    ON term_agreements
    FOR SELECT
    USING (auth.uid() = user_id);

-- =============================================
-- 3. users 테이블 확장 (signature_url, pre_registered 등)
-- =============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS pre_registered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_data_conflict BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.signature_url IS '전자서명 이미지 URL';
COMMENT ON COLUMN users.pre_registered IS '관리자 선등록 여부';
COMMENT ON COLUMN users.is_data_conflict IS '데이터 충돌 여부 (선등록 vs 직접입력 차이)';

-- =============================================
-- 4. 만료된 토큰 정리 함수
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- 만료된 리프레시 토큰 삭제 (7일 지난 것)
    DELETE FROM refresh_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days';

    -- 만료된 SMS 인증 삭제 (1일 지난 것)
    DELETE FROM sms_verifications
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. 고령자 여부 업데이트 함수
-- =============================================
CREATE OR REPLACE FUNCTION update_is_senior()
RETURNS TRIGGER AS $$
DECLARE
    age_years INTEGER;
BEGIN
    IF NEW.birth_date IS NOT NULL THEN
        age_years := EXTRACT(YEAR FROM age(NEW.birth_date));
        NEW.is_senior := age_years >= 65;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (없으면 생성)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_is_senior'
    ) THEN
        CREATE TRIGGER trigger_update_is_senior
        BEFORE INSERT OR UPDATE OF birth_date ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_is_senior();
    END IF;
END $$;

-- =============================================
-- 6. users 테이블에 is_senior 컬럼 추가 (없으면)
-- =============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_senior BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.is_senior IS '고령자 여부 (만 65세 이상)';

-- =============================================
-- 완료!
-- =============================================
