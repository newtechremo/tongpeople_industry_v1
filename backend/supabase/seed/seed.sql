-- =============================================
-- 테스트용 Seed 데이터
-- =============================================

-- 1. 회사 데이터
INSERT INTO companies (id, name, business_number, contact_email, contact_phone)
VALUES (1, '(주)통하는사람들', '123-45-67890', 'admin@tongpass.com', '02-1234-5678');

-- 시퀀스 업데이트
SELECT setval('companies_id_seq', 1);

-- 2. 현장 데이터
INSERT INTO sites (id, company_id, name, address, checkout_policy, auto_hours, work_day_start_hour, senior_age_threshold)
VALUES
    (1, 1, '경희대학교 학생회관', '서울특별시 동대문구 경희대로 26', 'AUTO_8H', 8, 4, 65),
    (2, 1, '삼성전자 평택캠퍼스', '경기도 평택시 삼성1로 1', 'MANUAL', 8, 4, 65),
    (3, 1, '현대건설 본사', '서울특별시 종로구 율곡로 75', 'AUTO_8H', 9, 4, 65);

SELECT setval('sites_id_seq', 3);

-- 3. 협력업체 데이터
INSERT INTO partners (id, company_id, name, contact_name, contact_phone)
VALUES
    (1, 1, '(주)정이앤지', '정철수', '010-1234-5678'),
    (2, 1, '한국건설(주)', '김영희', '010-2345-6789'),
    (3, 1, '대한전기', '박민수', '010-3456-7890'),
    (4, 1, '(주)삼우설비', '이지훈', '010-4567-8901');

SELECT setval('partners_id_seq', 4);

-- =============================================
-- 참고: 사용자(users) 데이터는 Supabase Auth를 통해 생성해야 합니다.
-- 테스트 시 아래 순서로 진행하세요:
--
-- 1. Supabase Dashboard > Authentication > Users에서 사용자 생성
-- 2. 생성된 UUID를 사용해 users 테이블에 INSERT
--
-- 예시:
-- INSERT INTO users (id, company_id, partner_id, name, phone, birth_date, role)
-- VALUES (
--     'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- Auth에서 생성된 UUID
--     1,                                        -- company_id
--     1,                                        -- partner_id
--     '홍길동',
--     '010-1111-2222',
--     '1960-05-15',
--     '근로자'
-- );
-- =============================================

-- 4. 테스트용 출퇴근 데이터 (users가 있다고 가정)
-- 실제 테스트 시 user_id를 실제 UUID로 교체해야 합니다.

-- INSERT INTO attendance (work_date, site_id, partner_id, user_id, worker_name, role, birth_date, age, is_senior, check_in_time, check_out_time, is_auto_out)
-- VALUES
--     ('2024-12-21', 1, 1, 'user-uuid-here', '홍길동', '근로자', '1960-05-15', 64, FALSE, '2024-12-21 08:30:00+09', '2024-12-21 17:30:00+09', TRUE),
--     ('2024-12-21', 1, 2, 'user-uuid-here', '김철수', '근로자', '1958-03-20', 66, TRUE, '2024-12-21 08:15:00+09', '2024-12-21 17:15:00+09', TRUE);
