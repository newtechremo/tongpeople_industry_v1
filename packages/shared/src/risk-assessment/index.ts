/**
 * 위험성평가 관련 모듈 export
 */

export {
  // 상수
  HIGH_RISK_TYPES,
  FREQUENCY_LEVELS,
  SEVERITY_LEVELS,
  RISK_MATRIX,

  // 타입
  type RiskRecord,
  type RecommendationResult,
  type ScoreResult,

  // 함수
  calculateScore,
  getRecommendations,
  getRecommendationsFromSupabase,
  calculateRiskGrade,
} from './recommender';
