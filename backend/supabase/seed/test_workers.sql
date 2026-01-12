-- =============================================
-- 테스트용 근로자 시드 데이터 (레거시)
-- =============================================
-- ⚠️ 주의: 이 SQL은 auth.users와 연결되지 않아 로그인 불가
--
-- ✅ 권장: seed-workers Edge Function 사용
--    - 생성: GET /seed-workers?action=create
--    - 삭제: GET /seed-workers?action=delete
--    - 비밀번호: test1234!
--
-- 이 SQL은 빠른 더미 데이터가 필요할 때만 사용
-- =============================================
-- 팀 구조:
-- 1. 통하는사람들 (안전팀)
-- 2. (주)대한전기 (전기1팀)
-- 3. (주)대한전기 (설비팀)
-- 4. (주)대한전기 (건축팀)
-- 5. 통하는사람들 (설계팀)
--
-- 총 근로자: 20명 이상, 고령자 포함, 각 팀 팀장 포함
-- =============================================

DO $$
DECLARE
    v_company_id BIGINT;
    v_site_id BIGINT;
    v_partner_safety_id BIGINT;      -- 안전팀
    v_partner_electric_id BIGINT;    -- 전기1팀
    v_partner_facility_id BIGINT;    -- 설비팀
    v_partner_construction_id BIGINT; -- 건축팀
    v_partner_design_id BIGINT;      -- 설계팀
BEGIN
    -- 첫 번째 회사와 현장 가져오기
    SELECT id INTO v_company_id FROM companies ORDER BY id LIMIT 1;
    SELECT id INTO v_site_id FROM sites WHERE company_id = v_company_id ORDER BY id LIMIT 1;

    IF v_company_id IS NULL OR v_site_id IS NULL THEN
        RAISE EXCEPTION '회사 또는 현장이 없습니다. 먼저 회원가입을 완료하세요.';
    END IF;

    RAISE NOTICE '회사 ID: %, 현장 ID: %', v_company_id, v_site_id;

    -- 기존 테스트 팀 삭제 (기본 '관리자', '일반근로자' 팀 제외)
    DELETE FROM partners
    WHERE company_id = v_company_id
      AND site_id = v_site_id
      AND name NOT IN ('관리자', '일반근로자');

    -- =============================================
    -- 1. 팀(협력업체) 생성
    -- =============================================

    -- 통하는사람들 (안전팀)
    INSERT INTO partners (company_id, site_id, name, contact_name, contact_phone, is_active)
    VALUES (v_company_id, v_site_id, '통하는사람들 (안전팀)', '김안전', '010-1000-0001', true)
    RETURNING id INTO v_partner_safety_id;

    -- (주)대한전기 (전기1팀)
    INSERT INTO partners (company_id, site_id, name, contact_name, contact_phone, is_active)
    VALUES (v_company_id, v_site_id, '(주)대한전기 (전기1팀)', '이전기', '010-2000-0001', true)
    RETURNING id INTO v_partner_electric_id;

    -- (주)대한전기 (설비팀)
    INSERT INTO partners (company_id, site_id, name, contact_name, contact_phone, is_active)
    VALUES (v_company_id, v_site_id, '(주)대한전기 (설비팀)', '박설비', '010-2000-0002', true)
    RETURNING id INTO v_partner_facility_id;

    -- (주)대한전기 (건축팀)
    INSERT INTO partners (company_id, site_id, name, contact_name, contact_phone, is_active)
    VALUES (v_company_id, v_site_id, '(주)대한전기 (건축팀)', '최건축', '010-2000-0003', true)
    RETURNING id INTO v_partner_construction_id;

    -- 통하는사람들 (설계팀)
    INSERT INTO partners (company_id, site_id, name, contact_name, contact_phone, is_active)
    VALUES (v_company_id, v_site_id, '통하는사람들 (설계팀)', '정설계', '010-1000-0002', true)
    RETURNING id INTO v_partner_design_id;

    RAISE NOTICE '팀 생성 완료 - 안전팀: %, 전기1팀: %, 설비팀: %, 건축팀: %, 설계팀: %',
        v_partner_safety_id, v_partner_electric_id, v_partner_facility_id, v_partner_construction_id, v_partner_design_id;

    -- =============================================
    -- 2. 테스트용 근로자 생성
    -- FK 제약 임시 비활성화
    -- =============================================
    ALTER TABLE users DISABLE TRIGGER ALL;

    -- 기존 테스트 근로자 삭제 (SUPER_ADMIN, SITE_ADMIN 제외)
    DELETE FROM users
    WHERE company_id = v_company_id
      AND role IN ('WORKER', 'TEAM_ADMIN')
      AND id NOT IN (SELECT id FROM auth.users);

    -- =============================================
    -- 통하는사람들 (안전팀) - 4명
    -- =============================================
    INSERT INTO users (id, company_id, site_id, partner_id, name, phone, birth_date, role, is_active) VALUES
    -- 팀장
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_safety_id, '김안전', '01010000001', '1975-03-15', 'TEAM_ADMIN', true),
    -- 팀원
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_safety_id, '이보안', '01010000002', '1982-07-22', 'WORKER', true),
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_safety_id, '박점검', '01010000003', '1958-11-08', 'WORKER', true),  -- 고령자
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_safety_id, '최감시', '01010000004', '1990-05-20', 'WORKER', true);

    -- =============================================
    -- (주)대한전기 (전기1팀) - 5명
    -- =============================================
    INSERT INTO users (id, company_id, site_id, partner_id, name, phone, birth_date, role, is_active) VALUES
    -- 팀장
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_electric_id, '이전기', '01020000001', '1978-01-10', 'TEAM_ADMIN', true),
    -- 팀원
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_electric_id, '김전선', '01020000002', '1985-09-30', 'WORKER', true),
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_electric_id, '박배선', '01020000003', '1956-12-25', 'WORKER', true),  -- 고령자
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_electric_id, '정전력', '01020000004', '1992-04-18', 'WORKER', true),
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_electric_id, '한전압', '01020000005', '1988-08-05', 'WORKER', true);

    -- =============================================
    -- (주)대한전기 (설비팀) - 4명
    -- =============================================
    INSERT INTO users (id, company_id, site_id, partner_id, name, phone, birth_date, role, is_active) VALUES
    -- 팀장
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_facility_id, '박설비', '01020100001', '1972-06-01', 'TEAM_ADMIN', true),
    -- 팀원
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_facility_id, '김배관', '01020100002', '1959-03-20', 'WORKER', true),  -- 고령자
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_facility_id, '이펌프', '01020100003', '1987-11-11', 'WORKER', true),
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_facility_id, '최공조', '01020100004', '1994-02-14', 'WORKER', true);

    -- =============================================
    -- (주)대한전기 (건축팀) - 5명
    -- =============================================
    INSERT INTO users (id, company_id, site_id, partner_id, name, phone, birth_date, role, is_active) VALUES
    -- 팀장
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_construction_id, '최건축', '01020200001', '1970-08-15', 'TEAM_ADMIN', true),
    -- 팀원
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_construction_id, '김목수', '01020200002', '1955-04-22', 'WORKER', true),  -- 고령자
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_construction_id, '이철근', '01020200003', '1983-10-08', 'WORKER', true),
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_construction_id, '박콘크리트', '01020200004', '1991-01-20', 'WORKER', true),
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_construction_id, '정미장', '01020200005', '1957-07-30', 'WORKER', true);  -- 고령자

    -- =============================================
    -- 통하는사람들 (설계팀) - 4명
    -- =============================================
    INSERT INTO users (id, company_id, site_id, partner_id, name, phone, birth_date, role, is_active) VALUES
    -- 팀장
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_design_id, '정설계', '01010100001', '1980-12-01', 'TEAM_ADMIN', true),
    -- 팀원
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_design_id, '김도면', '01010100002', '1989-05-15', 'WORKER', true),
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_design_id, '이캐드', '01010100003', '1995-09-22', 'WORKER', true),
    (gen_random_uuid(), v_company_id, v_site_id, v_partner_design_id, '박3D', '01010100004', '1960-02-28', 'WORKER', true);  -- 고령자

    -- FK 제약 다시 활성화
    ALTER TABLE users ENABLE TRIGGER ALL;

    RAISE NOTICE '========================================';
    RAISE NOTICE '테스트 근로자 생성 완료!';
    RAISE NOTICE '총 22명 (팀장 5명 + 팀원 17명)';
    RAISE NOTICE '고령자(65세+): 7명';
    RAISE NOTICE '========================================';
END $$;

-- =============================================
-- 3. 생성된 데이터 확인
-- =============================================

SELECT '===========================================' AS "===";
SELECT '팀(협력업체) 목록' AS "=== 결과 ===";
SELECT '===========================================' AS "===";

SELECT
    id,
    name AS "팀명",
    contact_name AS "담당자",
    contact_phone AS "연락처"
FROM partners
WHERE name NOT IN ('관리자', '일반근로자')
ORDER BY id;

SELECT '===========================================' AS "===";
SELECT '근로자 목록' AS "=== 결과 ===";
SELECT '===========================================' AS "===";

SELECT
    p.name AS "팀",
    u.name AS "이름",
    CASE u.role
        WHEN 'TEAM_ADMIN' THEN '팀장'
        WHEN 'WORKER' THEN '팀원'
    END AS "직책",
    u.phone AS "연락처",
    to_char(u.birth_date, 'YYYY-MM-DD') AS "생년월일",
    EXTRACT(YEAR FROM age(CURRENT_DATE, u.birth_date))::INTEGER AS "나이",
    CASE
        WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, u.birth_date)) >= 65
        THEN '● 고령자'
        ELSE ''
    END AS "고령"
FROM users u
LEFT JOIN partners p ON u.partner_id = p.id
WHERE u.role IN ('WORKER', 'TEAM_ADMIN')
ORDER BY p.name, u.role DESC, u.name;

SELECT '===========================================' AS "===";
SELECT '요약' AS "=== 결과 ===";
SELECT '===========================================' AS "===";

SELECT
    COUNT(*) AS "총 인원",
    COUNT(*) FILTER (WHERE role = 'TEAM_ADMIN') AS "팀장",
    COUNT(*) FILTER (WHERE role = 'WORKER') AS "팀원",
    COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM age(CURRENT_DATE, birth_date)) >= 65) AS "고령자(65+)"
FROM users
WHERE role IN ('WORKER', 'TEAM_ADMIN');

SELECT '===========================================' AS "===";
SELECT '팀별 현황' AS "=== 결과 ===";
SELECT '===========================================' AS "===";

SELECT
    p.name AS "팀",
    COUNT(*) AS "인원",
    COUNT(*) FILTER (WHERE u.role = 'TEAM_ADMIN') AS "팀장",
    COUNT(*) FILTER (WHERE u.role = 'WORKER') AS "팀원",
    COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM age(CURRENT_DATE, u.birth_date)) >= 65) AS "고령자"
FROM users u
LEFT JOIN partners p ON u.partner_id = p.id
WHERE u.role IN ('WORKER', 'TEAM_ADMIN')
GROUP BY p.name
ORDER BY p.name;
