-- 자동 퇴근 처리 함수
-- 매일 22:10(KST)에 실행하여 미퇴근자 전원 강제 퇴근
CREATE OR REPLACE FUNCTION auto_checkout_workers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE attendance
  SET
    check_out_time = NOW(),
    is_auto_out = true
  WHERE check_out_time IS NULL
    AND check_in_time IS NOT NULL
    AND work_date = CURRENT_DATE;
END;
$$;

-- pg_cron: 매일 22:10 (KST) = UTC 13:10
SELECT cron.schedule(
  'auto-checkout-workers',
  '10 13 * * *',
  $$SELECT auto_checkout_workers()$$
);
