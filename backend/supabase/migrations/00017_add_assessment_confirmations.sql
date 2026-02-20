-- 수시 위험성평가 문서 확인 이벤트 테이블
-- 목적: 수시 평가 문서를 누가, 언제 확인했는지 추적

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.assessment_confirmation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 평가 정보
  assessment_id UUID NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type = 'OCCASIONAL'),

  -- 확인자 정보
  confirmed_by_user_id UUID NOT NULL,
  confirmed_by_user_name TEXT NOT NULL,
  confirmed_by_department TEXT,

  -- 확인 일시
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_date DATE NOT NULL, -- YYYY-MM-DD (현장 기준 날짜)

  -- 출처
  source TEXT NOT NULL CHECK (source IN ('PC', 'MOBILE')),

  -- 생성 일시
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 고유 제약: 같은 평가/같은 사용자/같은 날짜는 1건만
  CONSTRAINT unique_confirmation_per_user_per_date
    UNIQUE (assessment_id, confirmed_by_user_id, confirmed_date)
);

-- 2. 인덱스 생성
CREATE INDEX idx_assessment_confirmations_assessment_id
  ON public.assessment_confirmation_events(assessment_id);

CREATE INDEX idx_assessment_confirmations_confirmed_date
  ON public.assessment_confirmation_events(confirmed_date);

CREATE INDEX idx_assessment_confirmations_user_id
  ON public.assessment_confirmation_events(confirmed_by_user_id);

-- 3. RLS (Row Level Security) 정책
ALTER TABLE public.assessment_confirmation_events ENABLE ROW LEVEL SECURITY;

-- 읽기: 인증된 사용자는 모든 확인 이벤트 조회 가능
CREATE POLICY "Anyone can view confirmation events"
  ON public.assessment_confirmation_events
  FOR SELECT
  TO authenticated
  USING (true);

-- 쓰기: 인증된 사용자는 자기 자신의 확인 이벤트만 생성 가능
CREATE POLICY "Users can create their own confirmations"
  ON public.assessment_confirmation_events
  FOR INSERT
  TO authenticated
  WITH CHECK (confirmed_by_user_id = auth.uid());

-- 삭제: 관리자만 가능 (추후 role 기반으로 확장 가능)
CREATE POLICY "Only admins can delete confirmations"
  ON public.assessment_confirmation_events
  FOR DELETE
  TO authenticated
  USING (false); -- 현재는 삭제 불가, 필요 시 role 체크 로직 추가

-- 4. 코멘트
COMMENT ON TABLE public.assessment_confirmation_events IS
  '수시 위험성평가 문서 확인 이벤트 - PC/모바일 열람 시 자동 등록';

COMMENT ON COLUMN public.assessment_confirmation_events.confirmed_date IS
  '확인 날짜 (YYYY-MM-DD) - 현장 기준 날짜, 일자별 집계에 사용';

COMMENT ON CONSTRAINT unique_confirmation_per_user_per_date ON public.assessment_confirmation_events IS
  '같은 사용자가 같은 날 같은 문서를 여러 번 확인해도 1건만 기록';
