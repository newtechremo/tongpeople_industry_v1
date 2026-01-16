-- =============================================
-- 근로자 가입 필드 추가
-- 근로자 앱 회사코드/QR 가입 시 필요한 필드들
-- =============================================

-- 1. users 테이블에 근로자 정보 필드 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gender VARCHAR(1) CHECK (gender IN ('M', 'F')),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(10) DEFAULT 'KR',
ADD COLUMN IF NOT EXISTS job_title VARCHAR(50),
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. 코멘트 추가
COMMENT ON COLUMN users.gender IS '성별: M(남성), F(여성)';
COMMENT ON COLUMN users.nationality IS '국적: KR(한국), OTHER(기타)';
COMMENT ON COLUMN users.job_title IS '직책 (예: 전기기사, 목공, 철근공)';
COMMENT ON COLUMN users.requested_at IS '가입 신청 일시 (방식 B: 회사코드/QR 가입)';
COMMENT ON COLUMN users.approved_at IS '가입 승인 일시';
COMMENT ON COLUMN users.approved_by IS '승인 관리자 ID';
COMMENT ON COLUMN users.rejection_reason IS '반려 사유';

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_requested_at ON users(requested_at) WHERE status = 'REQUESTED';
CREATE INDEX IF NOT EXISTS idx_users_approved_by ON users(approved_by);

-- =============================================
-- 완료!
-- =============================================
