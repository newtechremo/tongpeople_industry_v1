-- =============================================
-- 테스트용 출퇴근 데이터 시드
-- test_workers.sql 실행 후 실행
-- =============================================

DO $$
DECLARE
    v_site_id BIGINT;
    v_today DATE := CURRENT_DATE;
    v_worker RECORD;
    v_check_in_time TIMESTAMPTZ;
    v_check_out_time TIMESTAMPTZ;
    v_is_checked_out BOOLEAN;
    v_age INTEGER;
    v_is_senior BOOLEAN;
    v_attendance_count INTEGER := 0;
    v_senior_count INTEGER := 0;
BEGIN
    -- 첫 번째 현장 가져오기
    SELECT id INTO v_site_id FROM sites ORDER BY id LIMIT 1;

    IF v_site_id IS NULL THEN
        RAISE EXCEPTION '현장이 없습니다.';
    END IF;

    RAISE NOTICE '======================================';
    RAISE NOTICE '현장 ID: %, 오늘 날짜: %', v_site_id, v_today;
    RAISE NOTICE '======================================';

    -- 기존 오늘 출퇴근 데이터 삭제
    DELETE FROM attendance WHERE work_date = v_today AND site_id = v_site_id;

    -- 각 근로자에 대해 출퇴근 데이터 생성
    FOR v_worker IN
        SELECT
            u.id,
            u.name,
            u.birth_date,
            u.role,
            u.partner_id,
            p.name AS partner_name
        FROM users u
        LEFT JOIN partners p ON u.partner_id = p.id
        WHERE u.site_id = v_site_id
          AND u.role IN ('WORKER', 'TEAM_ADMIN')
          AND u.is_active = true
    LOOP
        -- 팀장은 100% 출근, 팀원은 85% 확률로 출근
        IF v_worker.role = 'TEAM_ADMIN' OR random() < 0.85 THEN
            -- 출근 시간: 오전 6:30 ~ 8:30 사이 랜덤
            v_check_in_time := v_today + INTERVAL '6 hours 30 minutes' + (random() * INTERVAL '2 hours');

            -- 퇴근 여부 결정 (40% 확률로 퇴근 완료 = 60% 근무중)
            v_is_checked_out := random() < 0.4;

            IF v_is_checked_out THEN
                -- 퇴근 시간: 출근 후 8~10시간 사이
                v_check_out_time := v_check_in_time + INTERVAL '8 hours' + (random() * INTERVAL '2 hours');
            ELSE
                v_check_out_time := NULL;
            END IF;

            -- 나이 및 고령자 여부 계산
            IF v_worker.birth_date IS NOT NULL THEN
                v_age := EXTRACT(YEAR FROM age(v_today, v_worker.birth_date))::INTEGER;
                v_is_senior := v_age >= 65;
                IF v_is_senior THEN
                    v_senior_count := v_senior_count + 1;
                END IF;
            ELSE
                v_age := NULL;
                v_is_senior := false;
            END IF;

            -- 출퇴근 기록 삽입
            INSERT INTO attendance (
                work_date,
                site_id,
                partner_id,
                user_id,
                worker_name,
                role,
                birth_date,
                age,
                is_senior,
                check_in_time,
                check_out_time,
                is_auto_out,
                has_accident
            ) VALUES (
                v_today,
                v_site_id,
                v_worker.partner_id,
                v_worker.id,
                v_worker.name,
                v_worker.role,
                v_worker.birth_date,
                v_age,
                v_is_senior,
                v_check_in_time,
                v_check_out_time,
                false,
                random() < 0.03  -- 3% 확률로 사고 발생
            );

            v_attendance_count := v_attendance_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '======================================';
    RAISE NOTICE '테스트 출퇴근 데이터 생성 완료!';
    RAISE NOTICE '총 출근: %명, 고령자: %명', v_attendance_count, v_senior_count;
    RAISE NOTICE '======================================';
END $$;

-- =============================================
-- 생성된 출퇴근 데이터 확인
-- =============================================

SELECT '===========================================' AS "===";
SELECT '오늘 출퇴근 현황' AS "=== 결과 ===";
SELECT '===========================================' AS "===";

SELECT
    p.name AS "팀",
    a.worker_name AS "이름",
    CASE a.role
        WHEN 'TEAM_ADMIN' THEN '팀장'
        WHEN 'WORKER' THEN '팀원'
    END AS "직책",
    a.age AS "나이",
    CASE WHEN a.is_senior THEN '● 고령자' ELSE '' END AS "고령",
    to_char(a.check_in_time, 'HH24:MI') AS "출근",
    COALESCE(to_char(a.check_out_time, 'HH24:MI'), '-') AS "퇴근",
    CASE
        WHEN a.check_out_time IS NOT NULL THEN '퇴근완료'
        ELSE '근무중'
    END AS "상태",
    CASE WHEN a.has_accident THEN '⚠️ 사고' ELSE '' END AS "사고"
FROM attendance a
LEFT JOIN partners p ON a.partner_id = p.id
WHERE a.work_date = CURRENT_DATE
ORDER BY p.name, a.role DESC, a.worker_name;

SELECT '===========================================' AS "===";
SELECT '대시보드 요약 (KPI)' AS "=== 결과 ===";
SELECT '===========================================' AS "===";

SELECT
    COUNT(*) AS "총 출근",
    COUNT(*) FILTER (WHERE check_out_time IS NOT NULL) AS "퇴근 완료",
    COUNT(*) FILTER (WHERE check_out_time IS NULL) AS "근무 중",
    COUNT(*) FILTER (WHERE is_senior) AS "고령자",
    COUNT(*) FILTER (WHERE has_accident) AS "사고",
    ROUND(
        COUNT(*) FILTER (WHERE check_out_time IS NOT NULL)::DECIMAL /
        NULLIF(COUNT(*), 0) * 100, 1
    ) || '%' AS "퇴근율"
FROM attendance
WHERE work_date = CURRENT_DATE;

SELECT '===========================================' AS "===";
SELECT '팀별 현황 (소속별 인원)' AS "=== 결과 ===";
SELECT '===========================================' AS "===";

SELECT
    COALESCE(p.name, '미배정') AS "팀",
    COUNT(*) AS "출근",
    COUNT(*) FILTER (WHERE a.check_out_time IS NOT NULL) AS "퇴근",
    COUNT(*) FILTER (WHERE a.check_out_time IS NULL) AS "근무중",
    COUNT(*) FILTER (WHERE a.is_senior) AS "고령자",
    COUNT(*) FILTER (WHERE a.has_accident) AS "사고"
FROM attendance a
LEFT JOIN partners p ON a.partner_id = p.id
WHERE a.work_date = CURRENT_DATE
GROUP BY p.name
ORDER BY COUNT(*) DESC;
