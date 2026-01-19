/**
 * 위험성평가 Mock 데이터
 *
 * UI 구현 및 테스트용 Mock 데이터
 * Phase 8에서 실제 DB 연동 시 제거 예정
 */

// ============ 타입 정의 ============

export type AssessmentType = 'INITIAL' | 'ADHOC' | 'FREQUENCY_INTENSITY';
export type AssessmentStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED';
export type RiskGradeLevel = '하' | '중' | '고';

export interface MockRiskCategory {
  id: string;
  name: string;
  description?: string;
  order_index: number;
}

export interface MockRiskSubcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  order_index: number;
}

export interface MockRiskFactor {
  id: string;
  subcategory_id: string;
  name: string;
  accident_type: string; // 재해형태
  description?: string;
}

export interface MockRiskAssessmentItem {
  id: string;
  risk_factor_id: string;
  risk_factor_name: string;
  accident_type: string;
  frequency?: number; // 1-4
  intensity?: number; // 1-5
  risk_grade?: number; // frequency × intensity
  grade_level?: RiskGradeLevel;
  measures?: string; // 개선대책
}

export interface MockRiskAssessment {
  id: string;
  type: AssessmentType;
  status: AssessmentStatus;
  title: string;
  site_id: string;
  site_name: string;
  team_id?: string;
  team_name?: string;
  creator_id: string;
  creator_name: string;
  work_start_date: string;
  work_end_date: string;
  category_id: string;
  category_name: string;
  subcategory_id?: string;
  subcategory_name?: string;
  trigger_reason?: string; // 수시평가 사유
  trigger_date?: string;
  created_at: string;
  updated_at: string;
  items: MockRiskAssessmentItem[];
}

// ============ Mock 데이터 ============

// 대분류 10개
export const mockCategories: MockRiskCategory[] = [
  { id: 'cat-1', name: '건설작업', order_index: 1 },
  { id: 'cat-2', name: '제조작업', order_index: 2 },
  { id: 'cat-3', name: '전기작업', order_index: 3 },
  { id: 'cat-4', name: '화학작업', order_index: 4 },
  { id: 'cat-5', name: '운반·하역 작업', order_index: 5 },
  { id: 'cat-6', name: '고소작업', order_index: 6 },
  { id: 'cat-7', name: '밀폐공간 작업', order_index: 7 },
  { id: 'cat-8', name: '용접·용단 작업', order_index: 8 },
  { id: 'cat-9', name: '기계·설비 작업', order_index: 9 },
  { id: 'cat-10', name: '기타 작업', order_index: 10 },
];

// 소분류 30개 (각 대분류당 3개씩)
export const mockSubcategories: MockRiskSubcategory[] = [
  // 건설작업
  { id: 'sub-1-1', category_id: 'cat-1', name: '철근작업', order_index: 1 },
  { id: 'sub-1-2', category_id: 'cat-1', name: '거푸집작업', order_index: 2 },
  { id: 'sub-1-3', category_id: 'cat-1', name: '비계작업', order_index: 3 },

  // 제조작업
  { id: 'sub-2-1', category_id: 'cat-2', name: '프레스 가공', order_index: 1 },
  { id: 'sub-2-2', category_id: 'cat-2', name: '절단 가공', order_index: 2 },
  { id: 'sub-2-3', category_id: 'cat-2', name: '조립 작업', order_index: 3 },

  // 전기작업
  { id: 'sub-3-1', category_id: 'cat-3', name: '배선 작업', order_index: 1 },
  { id: 'sub-3-2', category_id: 'cat-3', name: '설비 점검', order_index: 2 },
  { id: 'sub-3-3', category_id: 'cat-3', name: '고압 작업', order_index: 3 },

  // 화학작업
  { id: 'sub-4-1', category_id: 'cat-4', name: '약품 취급', order_index: 1 },
  { id: 'sub-4-2', category_id: 'cat-4', name: '혼합 작업', order_index: 2 },
  { id: 'sub-4-3', category_id: 'cat-4', name: '저장·운반', order_index: 3 },

  // 운반·하역 작업
  { id: 'sub-5-1', category_id: 'cat-5', name: '지게차 운전', order_index: 1 },
  { id: 'sub-5-2', category_id: 'cat-5', name: '크레인 작업', order_index: 2 },
  { id: 'sub-5-3', category_id: 'cat-5', name: '수작업 운반', order_index: 3 },

  // 고소작업
  { id: 'sub-6-1', category_id: 'cat-6', name: '사다리 작업', order_index: 1 },
  { id: 'sub-6-2', category_id: 'cat-6', name: '작업대 사용', order_index: 2 },
  { id: 'sub-6-3', category_id: 'cat-6', name: '로프 작업', order_index: 3 },

  // 밀폐공간 작업
  { id: 'sub-7-1', category_id: 'cat-7', name: '맨홀 작업', order_index: 1 },
  { id: 'sub-7-2', category_id: 'cat-7', name: '탱크 청소', order_index: 2 },
  { id: 'sub-7-3', category_id: 'cat-7', name: '지하 작업', order_index: 3 },

  // 용접·용단 작업
  { id: 'sub-8-1', category_id: 'cat-8', name: '가스 용접', order_index: 1 },
  { id: 'sub-8-2', category_id: 'cat-8', name: '아크 용접', order_index: 2 },
  { id: 'sub-8-3', category_id: 'cat-8', name: '절단 작업', order_index: 3 },

  // 기계·설비 작업
  { id: 'sub-9-1', category_id: 'cat-9', name: '기계 정비', order_index: 1 },
  { id: 'sub-9-2', category_id: 'cat-9', name: '설비 점검', order_index: 2 },
  { id: 'sub-9-3', category_id: 'cat-9', name: '부품 교체', order_index: 3 },

  // 기타 작업
  { id: 'sub-10-1', category_id: 'cat-10', name: '청소 작업', order_index: 1 },
  { id: 'sub-10-2', category_id: 'cat-10', name: '정리 작업', order_index: 2 },
  { id: 'sub-10-3', category_id: 'cat-10', name: '일반 작업', order_index: 3 },
];

// 위험요인 50개 샘플 (실제로는 100개 이상 필요)
export const mockRiskFactors: MockRiskFactor[] = [
  // 철근작업
  { id: 'rf-1', subcategory_id: 'sub-1-1', name: '철근 낙하', accident_type: '떨어짐' },
  { id: 'rf-2', subcategory_id: 'sub-1-1', name: '철근에 끼임', accident_type: '끼임' },
  { id: 'rf-3', subcategory_id: 'sub-1-1', name: '철근 베임', accident_type: '베임/찔림' },
  { id: 'rf-4', subcategory_id: 'sub-1-1', name: '작업발판 미끄러짐', accident_type: '넘어짐' },
  { id: 'rf-5', subcategory_id: 'sub-1-1', name: '중량물 취급 시 요통', accident_type: '무리한 동작' },

  // 거푸집작업
  { id: 'rf-6', subcategory_id: 'sub-1-2', name: '거푸집 붕괴', accident_type: '무너짐' },
  { id: 'rf-7', subcategory_id: 'sub-1-2', name: '자재 낙하', accident_type: '떨어짐' },
  { id: 'rf-8', subcategory_id: 'sub-1-2', name: '높은 곳에서 추락', accident_type: '떨어짐' },
  { id: 'rf-9', subcategory_id: 'sub-1-2', name: '못 찔림', accident_type: '베임/찔림' },

  // 비계작업
  { id: 'rf-10', subcategory_id: 'sub-1-3', name: '비계 붕괴', accident_type: '무너짐' },
  { id: 'rf-11', subcategory_id: 'sub-1-3', name: '비계에서 추락', accident_type: '떨어짐' },
  { id: 'rf-12', subcategory_id: 'sub-1-3', name: '자재 낙하', accident_type: '맞음' },

  // 프레스 가공
  { id: 'rf-13', subcategory_id: 'sub-2-1', name: '프레스에 끼임', accident_type: '끼임' },
  { id: 'rf-14', subcategory_id: 'sub-2-1', name: '소음 난청', accident_type: '소음' },
  { id: 'rf-15', subcategory_id: 'sub-2-1', name: '날카로운 모서리 베임', accident_type: '베임/찔림' },

  // 절단 가공
  { id: 'rf-16', subcategory_id: 'sub-2-2', name: '회전 공구에 끼임', accident_type: '끼임' },
  { id: 'rf-17', subcategory_id: 'sub-2-2', name: '파편 비산', accident_type: '맞음' },
  { id: 'rf-18', subcategory_id: 'sub-2-2', name: '절단날에 베임', accident_type: '베임/찔림' },

  // 배선 작업
  { id: 'rf-19', subcategory_id: 'sub-3-1', name: '감전', accident_type: '감전' },
  { id: 'rf-20', subcategory_id: 'sub-3-1', name: '높은 곳에서 추락', accident_type: '떨어짐' },
  { id: 'rf-21', subcategory_id: 'sub-3-1', name: '케이블에 걸림', accident_type: '넘어짐' },

  // 고압 작업
  { id: 'rf-22', subcategory_id: 'sub-3-3', name: '고압 감전', accident_type: '감전' },
  { id: 'rf-23', subcategory_id: 'sub-3-3', name: '아크 화상', accident_type: '화재폭발' },

  // 약품 취급
  { id: 'rf-24', subcategory_id: 'sub-4-1', name: '화학약품 접촉', accident_type: '화학물질' },
  { id: 'rf-25', subcategory_id: 'sub-4-1', name: '흡입 중독', accident_type: '질식' },
  { id: 'rf-26', subcategory_id: 'sub-4-1', name: '화재 발생', accident_type: '화재폭발' },

  // 지게차 운전
  { id: 'rf-27', subcategory_id: 'sub-5-1', name: '전복', accident_type: '떨어짐' },
  { id: 'rf-28', subcategory_id: 'sub-5-1', name: '협착', accident_type: '끼임' },
  { id: 'rf-29', subcategory_id: 'sub-5-1', name: '충돌', accident_type: '맞음' },

  // 크레인 작업
  { id: 'rf-30', subcategory_id: 'sub-5-2', name: '와이어 로프 파단', accident_type: '떨어짐' },
  { id: 'rf-31', subcategory_id: 'sub-5-2', name: '인양물 낙하', accident_type: '맞음' },
  { id: 'rf-32', subcategory_id: 'sub-5-2', name: '크레인 전복', accident_type: '무너짐' },

  // 사다리 작업
  { id: 'rf-33', subcategory_id: 'sub-6-1', name: '사다리에서 추락', accident_type: '떨어짐' },
  { id: 'rf-34', subcategory_id: 'sub-6-1', name: '사다리 미끄러짐', accident_type: '넘어짐' },

  // 맨홀 작업
  { id: 'rf-35', subcategory_id: 'sub-7-1', name: '산소 결핍', accident_type: '질식' },
  { id: 'rf-36', subcategory_id: 'sub-7-1', name: '유해가스 중독', accident_type: '질식' },
  { id: 'rf-37', subcategory_id: 'sub-7-1', name: '추락', accident_type: '떨어짐' },

  // 가스 용접
  { id: 'rf-38', subcategory_id: 'sub-8-1', name: '화재', accident_type: '화재폭발' },
  { id: 'rf-39', subcategory_id: 'sub-8-1', name: '폭발', accident_type: '화재폭발' },
  { id: 'rf-40', subcategory_id: 'sub-8-1', name: '화상', accident_type: '화상' },

  // 아크 용접
  { id: 'rf-41', subcategory_id: 'sub-8-2', name: '감전', accident_type: '감전' },
  { id: 'rf-42', subcategory_id: 'sub-8-2', name: '아크광 화상', accident_type: '화상' },
  { id: 'rf-43', subcategory_id: 'sub-8-2', name: '흄 흡입', accident_type: '화학물질' },

  // 기계 정비
  { id: 'rf-44', subcategory_id: 'sub-9-1', name: '회전부에 끼임', accident_type: '끼임' },
  { id: 'rf-45', subcategory_id: 'sub-9-1', name: '공구 미끄러짐', accident_type: '베임/찔림' },
  { id: 'rf-46', subcategory_id: 'sub-9-1', name: '중량 부품 낙하', accident_type: '맞음' },

  // 일반 작업
  { id: 'rf-47', subcategory_id: 'sub-10-3', name: '장시간 작업 피로', accident_type: '무리한 동작' },
  { id: 'rf-48', subcategory_id: 'sub-10-3', name: '미끄러짐', accident_type: '넘어짐' },
  { id: 'rf-49', subcategory_id: 'sub-10-3', name: '돌출부 부딪힘', accident_type: '맞음' },
  { id: 'rf-50', subcategory_id: 'sub-10-3', name: '무거운 물건 요통', accident_type: '무리한 동작' },
];

// 위험성평가 문서 20개 샘플
export const mockAssessments: MockRiskAssessment[] = [
  // 최초 위험성평가 (작업종료)
  {
    id: 'ra-1',
    type: 'INITIAL',
    status: 'COMPLETED',
    title: '2024년 상반기 최초 위험성평가',
    site_id: 'site-1',
    site_name: '대전공장',
    team_id: 'team-1',
    team_name: '(주)정이앤지',
    creator_id: 'user-1',
    creator_name: '홍길동',
    work_start_date: '2024-01-01',
    work_end_date: '2024-06-30',
    category_id: 'cat-1',
    category_name: '건설작업',
    subcategory_id: 'sub-1-1',
    subcategory_name: '철근작업',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    items: [
      {
        id: 'item-1',
        risk_factor_id: 'rf-1',
        risk_factor_name: '철근 낙하',
        accident_type: '떨어짐',
      },
      {
        id: 'item-2',
        risk_factor_id: 'rf-2',
        risk_factor_name: '철근에 끼임',
        accident_type: '끼임',
      },
      {
        id: 'item-3',
        risk_factor_id: 'rf-3',
        risk_factor_name: '철근 베임',
        accident_type: '베임/찔림',
      },
    ],
  },

  // 최초 위험성평가 (작업기간중)
  {
    id: 'ra-2',
    type: 'INITIAL',
    status: 'IN_PROGRESS',
    title: '2024년 하반기 최초 위험성평가',
    site_id: 'site-1',
    site_name: '대전공장',
    team_id: 'team-2',
    team_name: '협력업체A',
    creator_id: 'user-2',
    creator_name: '김철수',
    work_start_date: '2024-07-01',
    work_end_date: '2024-12-31',
    category_id: 'cat-2',
    category_name: '제조작업',
    subcategory_id: 'sub-2-1',
    subcategory_name: '프레스 가공',
    created_at: '2024-07-10T10:00:00Z',
    updated_at: '2024-07-15T14:00:00Z',
    items: [
      {
        id: 'item-4',
        risk_factor_id: 'rf-13',
        risk_factor_name: '프레스에 끼임',
        accident_type: '끼임',
      },
      {
        id: 'item-5',
        risk_factor_id: 'rf-14',
        risk_factor_name: '소음 난청',
        accident_type: '소음',
      },
    ],
  },

  // 수시 위험성평가 (빈도강도)
  {
    id: 'ra-3',
    type: 'ADHOC',
    status: 'IN_PROGRESS',
    title: '신규 설비 도입에 따른 수시 위험성평가',
    site_id: 'site-2',
    site_name: '서울본사',
    team_id: 'team-3',
    team_name: '(주)건설엔지니어링',
    creator_id: 'user-3',
    creator_name: '이영희',
    work_start_date: '2024-08-01',
    work_end_date: '2024-08-31',
    category_id: 'cat-9',
    category_name: '기계·설비 작업',
    subcategory_id: 'sub-9-1',
    subcategory_name: '기계 정비',
    trigger_reason: '신규 프레스 설비 도입',
    trigger_date: '2024-08-01',
    created_at: '2024-08-02T11:00:00Z',
    updated_at: '2024-08-05T16:00:00Z',
    items: [
      {
        id: 'item-6',
        risk_factor_id: 'rf-44',
        risk_factor_name: '회전부에 끼임',
        accident_type: '끼임',
        frequency: 3,
        intensity: 4,
        risk_grade: 12,
        grade_level: '중',
        measures: '안전덮개 설치, 비상정지장치 설치, 작업 전 안전교육',
      },
      {
        id: 'item-7',
        risk_factor_id: 'rf-45',
        risk_factor_name: '공구 미끄러짐',
        accident_type: '베임/찔림',
        frequency: 2,
        intensity: 2,
        risk_grade: 4,
        grade_level: '하',
        measures: '안전장갑 착용, 공구 정기 점검',
      },
      {
        id: 'item-8',
        risk_factor_id: 'rf-46',
        risk_factor_name: '중량 부품 낙하',
        accident_type: '맞음',
        frequency: 2,
        intensity: 4,
        risk_grade: 8,
        grade_level: '중',
        measures: '호이스트 사용, 안전화 착용, 작업구역 통제',
      },
    ],
  },

  // 추가 샘플 (간략하게)
  {
    id: 'ra-4',
    type: 'INITIAL',
    status: 'APPROVED',
    title: '2023년 최초 위험성평가',
    site_id: 'site-1',
    site_name: '대전공장',
    creator_id: 'user-1',
    creator_name: '홍길동',
    work_start_date: '2023-01-01',
    work_end_date: '2023-12-31',
    category_id: 'cat-1',
    category_name: '건설작업',
    created_at: '2023-01-10T09:00:00Z',
    updated_at: '2023-01-25T15:00:00Z',
    items: [],
  },

  {
    id: 'ra-5',
    type: 'ADHOC',
    status: 'COMPLETED',
    title: '작업방법 변경에 따른 수시평가',
    site_id: 'site-2',
    site_name: '서울본사',
    creator_id: 'user-2',
    creator_name: '김철수',
    work_start_date: '2024-05-01',
    work_end_date: '2024-05-31',
    category_id: 'cat-3',
    category_name: '전기작업',
    trigger_reason: '작업방법 변경',
    trigger_date: '2024-05-01',
    created_at: '2024-05-02T10:00:00Z',
    updated_at: '2024-05-15T14:00:00Z',
    items: [],
  },
];

// ============ Helper Functions ============

/**
 * 대분류 ID로 소분류 목록 가져오기
 */
export function getSubcategoriesByCategoryId(categoryId: string): MockRiskSubcategory[] {
  return mockSubcategories.filter(sub => sub.category_id === categoryId);
}

/**
 * 소분류 ID로 위험요인 목록 가져오기
 */
export function getRiskFactorsBySubcategoryId(subcategoryId: string): MockRiskFactor[] {
  return mockRiskFactors.filter(factor => factor.subcategory_id === subcategoryId);
}

/**
 * ID로 대분류 찾기
 */
export function getCategoryById(id: string): MockRiskCategory | undefined {
  return mockCategories.find(cat => cat.id === id);
}

/**
 * ID로 소분류 찾기
 */
export function getSubcategoryById(id: string): MockRiskSubcategory | undefined {
  return mockSubcategories.find(sub => sub.id === id);
}

/**
 * ID로 위험요인 찾기
 */
export function getRiskFactorById(id: string): MockRiskFactor | undefined {
  return mockRiskFactors.find(factor => factor.id === id);
}

/**
 * ID로 위험성평가 찾기
 */
export function getAssessmentById(id: string): MockRiskAssessment | undefined {
  return mockAssessments.find(assessment => assessment.id === id);
}
