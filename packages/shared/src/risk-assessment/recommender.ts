/**
 * 산업현장통 위험요인 추천 엔진 (Recommendation Engine)
 *
 * Python recommender.py를 TypeScript로 변환
 * 사용자의 입력 조건에 맞춰 최적의 위험요인을 추천
 */

// 고위험 재해형태 정의
export const HIGH_RISK_TYPES = ['떨어짐', '끼임', '질식', '화재폭발'] as const;

// 타입 정의
export interface RiskRecord {
  id: number;
  task_name: string;
  risk_factor: string;
  accident_type: string;
  measures_admin?: string;
  measures_tech?: string;
  measures_personal?: string;
  risk_frequency?: number;
  risk_severity?: number;
}

export interface RecommendationResult {
  id: number;
  task_name: string;
  risk_factor: string;
  accident_type: string;
  score: number;
  reason: string;
}

export interface ScoreResult {
  score: number;
  reasonParts: string[];
}

/**
 * 개별 레코드의 점수 계산
 *
 * Scoring Rule v1.1:
 * 1. 키워드 적합도 (40점): task_name +40, risk_factor +20, measures +10
 * 2. 재해형태 가중치 (30점): 고위험 재해 해당시
 * 3. 복합 매칭 (30점): 2개 이상 키워드 매칭시
 */
export function calculateScore(record: RiskRecord, keywords: string[]): ScoreResult {
  let score = 0;
  const reasonParts: string[] = [];
  const matchedKeywords = new Set<string>();

  const taskName = record.task_name || '';
  const riskFactor = record.risk_factor || '';
  const measuresAdmin = record.measures_admin || '';
  const measuresTech = record.measures_tech || '';
  const measuresPersonal = record.measures_personal || '';
  const accidentType = record.accident_type || '';

  const allMeasures = `${measuresAdmin} ${measuresTech} ${measuresPersonal}`;

  // 1. 키워드 적합도 (최대 40점 per keyword)
  for (const kw of keywords) {
    // task_name 매칭 (+40점, 최고점)
    if (taskName.includes(kw)) {
      score += 40;
      reasonParts.push(`작업명 '${kw}' 매칭(40)`);
      matchedKeywords.add(kw);
    }
    // risk_factor 매칭 (+20점)
    else if (riskFactor.includes(kw)) {
      score += 20;
      reasonParts.push(`위험요인 '${kw}' 매칭(20)`);
      matchedKeywords.add(kw);
    }
    // measures 매칭 (+10점)
    else if (allMeasures.includes(kw)) {
      score += 10;
      reasonParts.push(`대책 '${kw}' 매칭(10)`);
      matchedKeywords.add(kw);
    }
  }

  // 2. 재해형태 가중치 (30점)
  if ((HIGH_RISK_TYPES as readonly string[]).includes(accidentType)) {
    score += 30;
    reasonParts.push(`고위험 '${accidentType}'(30)`);
  }

  // 3. 복합 매칭 (30점)
  if (matchedKeywords.size >= 2) {
    score += 30;
    reasonParts.push(`복합매칭 ${matchedKeywords.size}개(30)`);
  }

  return { score, reasonParts };
}

/**
 * 위험요인 추천 함수 (메모리 기반)
 *
 * DB에서 미리 로드된 데이터를 필터링하고 스코어링
 */
export function getRecommendations(
  records: RiskRecord[],
  keywords: string[],
  limit: number = 50
): RecommendationResult[] {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  // 1차 필터링: 키워드 포함된 레코드만
  const candidates = records.filter(record => {
    const taskName = record.task_name || '';
    const riskFactor = record.risk_factor || '';
    const measuresAdmin = record.measures_admin || '';
    const measuresTech = record.measures_tech || '';
    const measuresPersonal = record.measures_personal || '';

    const searchText = `${taskName} ${riskFactor} ${measuresAdmin} ${measuresTech} ${measuresPersonal}`;

    return keywords.some(kw => searchText.includes(kw));
  });

  // 2단계: 정밀 스코어링
  const scoredResults: RecommendationResult[] = [];
  const seenRiskFactors = new Set<string>();

  for (const record of candidates) {
    const { score, reasonParts } = calculateScore(record, keywords);

    // 0점 제외
    if (score === 0) continue;

    // 중복 제거 (risk_factor 기준)
    const riskFactor = record.risk_factor;
    if (seenRiskFactors.has(riskFactor)) continue;
    seenRiskFactors.add(riskFactor);

    scoredResults.push({
      id: record.id,
      task_name: record.task_name,
      risk_factor: record.risk_factor,
      accident_type: record.accident_type,
      score,
      reason: reasonParts.join(' + ')
    });
  }

  // 점수 내림차순 정렬
  scoredResults.sort((a, b) => b.score - a.score);

  // 상위 N개 반환
  return scoredResults.slice(0, limit);
}

/**
 * Supabase용 추천 함수
 *
 * Supabase RPC 또는 Edge Function에서 사용
 */
export async function getRecommendationsFromSupabase(
  supabase: { from: (table: string) => any },
  keywords: string[],
  limit: number = 50
): Promise<RecommendationResult[]> {
  if (!keywords || keywords.length === 0) {
    return [];
  }

  // OR 조건으로 LIKE 검색
  let query = supabase
    .from('risk_assessment')
    .select('id, task_name, risk_factor, accident_type, measures_admin, measures_tech, measures_personal');

  // 키워드별 OR 조건 생성
  const orConditions = keywords.map(kw =>
    `task_name.ilike.%${kw}%,risk_factor.ilike.%${kw}%,measures_admin.ilike.%${kw}%,measures_tech.ilike.%${kw}%`
  ).join(',');

  const { data: candidates, error } = await query.or(orConditions);

  if (error || !candidates) {
    console.error('Supabase query error:', error);
    return [];
  }

  // 스코어링 및 정렬
  const scoredResults: RecommendationResult[] = [];
  const seenRiskFactors = new Set<string>();

  for (const record of candidates as RiskRecord[]) {
    const { score, reasonParts } = calculateScore(record, keywords);

    if (score === 0) continue;

    const riskFactor = record.risk_factor;
    if (seenRiskFactors.has(riskFactor)) continue;
    seenRiskFactors.add(riskFactor);

    scoredResults.push({
      id: record.id,
      task_name: record.task_name,
      risk_factor: record.risk_factor,
      accident_type: record.accident_type,
      score,
      reason: reasonParts.join(' + ')
    });
  }

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.slice(0, limit);
}

/**
 * 위험성 등급 계산 (빈도 × 강도)
 *
 * 빈도(1-4) × 강도(1-5) = 점수(1-20)
 * - 하(1-6): 낮은 위험
 * - 중(7-14): 중간 위험
 * - 고(15-20): 높은 위험
 */
export function calculateRiskGrade(frequency: number, severity: number): {
  score: number;
  grade: '하' | '중' | '고';
  color: string;
} {
  const score = frequency * severity;

  let grade: '하' | '중' | '고';
  let color: string;

  if (score <= 6) {
    grade = '하';
    color = '#22C55E'; // green-500
  } else if (score <= 14) {
    grade = '중';
    color = '#F59E0B'; // amber-500
  } else {
    grade = '고';
    color = '#EF4444'; // red-500
  }

  return { score, grade, color };
}

/**
 * 빈도 레벨 정의
 */
export const FREQUENCY_LEVELS = [
  { value: 1, label: '매우 드묾', description: '1년에 1회 미만' },
  { value: 2, label: '가끔', description: '1년에 수 회' },
  { value: 3, label: '자주', description: '월 1회 이상' },
  { value: 4, label: '매우 자주', description: '주 1회 이상' },
] as const;

/**
 * 강도 레벨 정의
 */
export const SEVERITY_LEVELS = [
  { value: 1, label: '경미', description: '응급처치 수준' },
  { value: 2, label: '경상', description: '의료처치 필요' },
  { value: 3, label: '중상', description: '휴업 필요' },
  { value: 4, label: '중대재해', description: '영구 장애' },
  { value: 5, label: '사망', description: '사망사고 가능' },
] as const;

/**
 * 위험성 매트릭스 (빈도 × 강도)
 *
 * 색상 코드:
 * - 초록: 하 (1-6)
 * - 노랑: 중 (7-14)
 * - 빨강: 고 (15-20)
 */
export const RISK_MATRIX: { score: number; grade: '하' | '중' | '고' }[][] = [
  // 빈도 1
  [
    { score: 1, grade: '하' },  // 강도 1
    { score: 2, grade: '하' },  // 강도 2
    { score: 3, grade: '하' },  // 강도 3
    { score: 4, grade: '하' },  // 강도 4
    { score: 5, grade: '하' },  // 강도 5
  ],
  // 빈도 2
  [
    { score: 2, grade: '하' },
    { score: 4, grade: '하' },
    { score: 6, grade: '하' },
    { score: 8, grade: '중' },
    { score: 10, grade: '중' },
  ],
  // 빈도 3
  [
    { score: 3, grade: '하' },
    { score: 6, grade: '하' },
    { score: 9, grade: '중' },
    { score: 12, grade: '중' },
    { score: 15, grade: '고' },
  ],
  // 빈도 4
  [
    { score: 4, grade: '하' },
    { score: 8, grade: '중' },
    { score: 12, grade: '중' },
    { score: 16, grade: '고' },
    { score: 20, grade: '고' },
  ],
];
