/**
 * AI 위험요인 추천 Mock 데이터
 *
 * 실제 백엔드 API 연동 전까지 사용되는 Mock 데이터
 * 추후 실제 API로 교체 예정
 */

export interface AIRecommendation {
  id: number;
  taskName: string;        // 작업명
  riskFactor: string;      // 위험요인
  accidentType: string;    // 재해형태
  score: number;           // 추천 점수 (0-100)
  reason: string;          // 추천 근거
  improvement: string;     // 개선대책
}

/**
 * Mock AI 추천 데이터
 * 키: "{categoryId}-{subcategoryId}"
 */
export const MOCK_AI_RECOMMENDATIONS: Record<string, AIRecommendation[]> = {
  // 건설업(1) - 가설전선 설치작업(101)
  '1-101': [
    {
      id: 9001,
      taskName: '가설전선 설치작업',
      riskFactor: '안전대를 사용하지 않고 고소부위 작업중 추락',
      accidentType: '떨어짐',
      score: 90,
      reason: "작업명 '가설전선' 매칭(40) + 고위험 '떨어짐'(30) + 복합매칭(20)",
      improvement: '고소부위 작업시 안전대 고리 체결 철저'
    },
    {
      id: 9002,
      taskName: '전선작업',
      riskFactor: '전선 접촉으로 인한 감전',
      accidentType: '감전',
      score: 80,
      reason: "위험요인 '전선' 매칭(20) + 고위험 '감전'(30) + 복합매칭(30)",
      improvement: '절연장갑 착용 및 전원 차단 후 작업'
    },
    {
      id: 9003,
      taskName: '가설전선 설치작업',
      riskFactor: '불안전한 작업발판으로 인한 추락',
      accidentType: '떨어짐',
      score: 75,
      reason: "작업명 '가설전선' 매칭(40) + 고위험 '떨어짐'(30)",
      improvement: '안전 작업발판 설치 후 작업 실시'
    },
    {
      id: 9004,
      taskName: '전선 설치',
      riskFactor: '젖은 손으로 전선 취급 시 감전',
      accidentType: '감전',
      score: 70,
      reason: "위험요인 '전선' 매칭(20) + 고위험 '감전'(30) + 복합매칭(20)",
      improvement: '작업 전 손 건조 확인 및 절연장갑 착용'
    },
    {
      id: 9005,
      taskName: '가설작업',
      riskFactor: '안전난간 미설치로 인한 추락',
      accidentType: '떨어짐',
      score: 65,
      reason: "작업명 '가설' 매칭(40) + 고위험 '떨어짐'(30)",
      improvement: '작업 전 안전난간 설치 확인'
    },
    {
      id: 9006,
      taskName: '전기작업',
      riskFactor: '차단기 미설치 상태에서 통전 작업',
      accidentType: '감전',
      score: 60,
      reason: "대책 '전기' 매칭(10) + 고위험 '감전'(30) + 복합매칭(20)",
      improvement: '작업 전 차단기 설치 및 잠금장치 실시'
    },
    {
      id: 9007,
      taskName: '설치작업',
      riskFactor: '비계 연결 불량으로 인한 붕괴',
      accidentType: '무너짐',
      score: 55,
      reason: "작업명 '설치' 매칭(40)",
      improvement: '비계 연결부 점검 및 고정 철저'
    },
    {
      id: 9008,
      taskName: '고소작업',
      riskFactor: '안전모 미착용으로 인한 낙하물 충격',
      accidentType: '맞음',
      score: 50,
      reason: "대책 '안전모' 매칭(10) + 복합매칭(20)",
      improvement: '작업장 출입 시 안전모 착용 의무화'
    }
  ],

  // 건설업(1) - 가설전선 점검작업(102)
  '1-102': [
    {
      id: 9011,
      taskName: '가설전선 점검작업',
      riskFactor: '점검 중 충전부 접촉으로 인한 감전',
      accidentType: '감전',
      score: 95,
      reason: "작업명 '가설전선 점검' 매칭(40) + 고위험 '감전'(30) + 복합매칭(30)",
      improvement: '점검 전 전원 차단 및 무전압 확인'
    },
    {
      id: 9012,
      taskName: '전선 점검',
      riskFactor: '사다리 작업 중 균형 상실로 추락',
      accidentType: '떨어짐',
      score: 85,
      reason: "위험요인 '전선' 매칭(20) + 고위험 '떨어짐'(30) + 복합매칭(30)",
      improvement: '사다리 고정 및 보조자 배치'
    },
    {
      id: 9013,
      taskName: '점검작업',
      riskFactor: '절연장갑 미착용으로 인한 감전',
      accidentType: '감전',
      score: 75,
      reason: "작업명 '점검' 매칭(40) + 고위험 '감전'(30)",
      improvement: '절연장갑 및 절연화 착용 필수'
    },
    {
      id: 9014,
      taskName: '전선 점검',
      riskFactor: '경년 열화된 전선 파손으로 감전',
      accidentType: '감전',
      score: 70,
      reason: "위험요인 '전선' 매칭(20) + 고위험 '감전'(30) + 복합매칭(20)",
      improvement: '점검 시 전선 피복 상태 확인 철저'
    },
    {
      id: 9015,
      taskName: '점검작업',
      riskFactor: '점검 중 공구 낙하로 인한 맞음',
      accidentType: '맞음',
      score: 60,
      reason: "작업명 '점검' 매칭(40) + 복합매칭(20)",
      improvement: '공구 떨어짐 방지용 끈 사용'
    }
  ],

  // 건설업(1) - 꽂음 접속기작업(103)
  '1-103': [
    {
      id: 9021,
      taskName: '꽂음 접속기작업',
      riskFactor: '접속기 결합 불량으로 인한 감전',
      accidentType: '감전',
      score: 90,
      reason: "작업명 '꽂음 접속기' 매칭(40) + 고위험 '감전'(30) + 복합매칭(20)",
      improvement: '접속 후 결합 상태 확인 철저'
    },
    {
      id: 9022,
      taskName: '전기 접속 작업',
      riskFactor: '절연 파손된 접속기 사용으로 감전',
      accidentType: '감전',
      score: 85,
      reason: "위험요인 '접속' 매칭(20) + 고위험 '감전'(30) + 복합매칭(30)",
      improvement: '접속기 사용 전 외관 점검 실시'
    },
    {
      id: 9023,
      taskName: '접속작업',
      riskFactor: '손에 물기가 있는 상태에서 접속 시 감전',
      accidentType: '감전',
      score: 75,
      reason: "작업명 '접속' 매칭(40) + 고위험 '감전'(30)",
      improvement: '작업 전 손 건조 확인 및 절연장갑 착용'
    }
  ],

  // 건설업(1) - 이동형 릴 전선작업(104)
  '1-104': [
    {
      id: 9031,
      taskName: '이동형 릴 전선작업',
      riskFactor: '전선 피복 손상으로 인한 감전',
      accidentType: '감전',
      score: 92,
      reason: "작업명 '이동형 릴 전선' 매칭(40) + 고위험 '감전'(30) + 복합매칭(30)",
      improvement: '작업 전 전선 피복 상태 확인'
    },
    {
      id: 9032,
      taskName: '릴 전선 작업',
      riskFactor: '전선릴 이동 중 손 끼임',
      accidentType: '끼임',
      score: 80,
      reason: "위험요인 '릴' 매칭(20) + 고위험 '끼임'(30) + 복합매칭(30)",
      improvement: '릴 이동 시 손잡이 사용 및 장갑 착용'
    },
    {
      id: 9033,
      taskName: '전선 작업',
      riskFactor: '과부하로 인한 전선 과열 및 화재',
      accidentType: '화재',
      score: 75,
      reason: "작업명 '전선' 매칭(40) + 고위험 '화재'(30)",
      improvement: '정격 용량 확인 및 과부하 방지'
    }
  ],

  // 건설업(1) - 전동공구 사용/정리정돈작업(105)
  '1-105': [
    {
      id: 9041,
      taskName: '전동공구 사용작업',
      riskFactor: '접지 미설치로 인한 감전',
      accidentType: '감전',
      score: 88,
      reason: "작업명 '전동공구' 매칭(40) + 고위험 '감전'(30) + 복합매칭(20)",
      improvement: '전동공구 접지 확인 후 사용'
    },
    {
      id: 9042,
      taskName: '공구 사용',
      riskFactor: '회전 날에 손 접촉으로 절단',
      accidentType: '절단/베임',
      score: 82,
      reason: "위험요인 '공구' 매칭(20) + 복합매칭(30)",
      improvement: '보호장갑 착용 및 작업 중 집중'
    },
    {
      id: 9043,
      taskName: '전동공구 정리',
      riskFactor: '전선 정리 중 걸려 넘어짐',
      accidentType: '넘어짐',
      score: 70,
      reason: "작업명 '정리' 매칭(40) + 복합매칭(30)",
      improvement: '전선 정리 시 통로 확보'
    },
    {
      id: 9044,
      taskName: '정리정돈',
      riskFactor: '공구 낙하로 인한 맞음',
      accidentType: '맞음',
      score: 65,
      reason: "작업명 '정리정돈' 매칭(40) + 복합매칭(20)",
      improvement: '공구 보관 시 안전한 위치에 배치'
    }
  ],

  // 추가 카테고리/소분류 조합 (예시)
  '2-201': [
    {
      id: 9051,
      taskName: '용접 작업',
      riskFactor: '용접 불꽃으로 인한 화재',
      accidentType: '화재',
      score: 95,
      reason: "작업명 '용접' 매칭(40) + 고위험 '화재'(30) + 복합매칭(30)",
      improvement: '작업 전 가연물 제거 및 소화기 비치'
    },
    {
      id: 9052,
      taskName: '용접',
      riskFactor: '용접 흄 흡입으로 인한 질식',
      accidentType: '질식',
      score: 85,
      reason: "작업명 '용접' 매칭(40) + 고위험 '질식'(30)",
      improvement: '환기 설비 가동 및 방독 마스크 착용'
    }
  ],

  // 대분류 3 - 가설전선 설치작업
  '3-101': [
    {
      id: 9061,
      taskName: '가설전선 설치작업',
      riskFactor: '안전대를 사용하지 않고 고소부위 작업중 추락',
      accidentType: '떨어짐',
      score: 90,
      reason: "작업명 '가설전선' 매칭(40) + 고위험 '떨어짐'(30) + 복합매칭(20)",
      improvement: '고소부위 작업시 안전대 고리 체결 철저'
    },
    {
      id: 9062,
      taskName: '전선작업',
      riskFactor: '전선 접촉으로 인한 감전',
      accidentType: '감전',
      score: 80,
      reason: "위험요인 '전선' 매칭(20) + 고위험 '감전'(30) + 복합매칭(30)",
      improvement: '절연장갑 착용 및 전원 차단 후 작업'
    },
    {
      id: 9063,
      taskName: '가설전선 설치작업',
      riskFactor: '불안전한 작업발판으로 인한 추락',
      accidentType: '떨어짐',
      score: 75,
      reason: "작업명 '가설전선' 매칭(40) + 고위험 '떨어짐'(30)",
      improvement: '안전 작업발판 설치 후 작업 실시'
    }
  ],

  // 대분류 3 - 가설전선 점검작업
  '3-102': [
    {
      id: 9071,
      taskName: '가설전선 점검작업',
      riskFactor: '점검 중 충전부 접촉으로 인한 감전',
      accidentType: '감전',
      score: 95,
      reason: "작업명 '가설전선 점검' 매칭(40) + 고위험 '감전'(30) + 복합매칭(30)",
      improvement: '점검 전 전원 차단 및 무전압 확인'
    },
    {
      id: 9072,
      taskName: '전선 점검',
      riskFactor: '사다리 작업 중 균형 상실로 추락',
      accidentType: '떨어짐',
      score: 85,
      reason: "위험요인 '전선' 매칭(20) + 고위험 '떨어짐'(30) + 복합매칭(30)",
      improvement: '사다리 고정 및 보조자 배치'
    }
  ],

  // 대분류 3 - 기타 소분류들
  '3-103': [
    {
      id: 9081,
      taskName: '꽂음 접속기작업',
      riskFactor: '접속기 결합 불량으로 인한 감전',
      accidentType: '감전',
      score: 90,
      reason: "작업명 '꽂음 접속기' 매칭(40) + 고위험 '감전'(30) + 복합매칭(20)",
      improvement: '접속 후 결합 상태 확인 철저'
    }
  ],

  '3-104': [
    {
      id: 9091,
      taskName: '이동형 릴 전선작업',
      riskFactor: '전선 피복 손상으로 인한 감전',
      accidentType: '감전',
      score: 92,
      reason: "작업명 '이동형 릴 전선' 매칭(40) + 고위험 '감전'(30) + 복합매칭(30)",
      improvement: '작업 전 전선 피복 상태 확인'
    }
  ],

  '3-105': [
    {
      id: 9101,
      taskName: '전동공구 사용작업',
      riskFactor: '접지 미설치로 인한 감전',
      accidentType: '감전',
      score: 88,
      reason: "작업명 '전동공구' 매칭(40) + 고위험 '감전'(30) + 복합매칭(20)",
      improvement: '전동공구 접지 확인 후 사용'
    }
  ]
};

/**
 * 카테고리/소분류 조합으로 AI 추천 조회
 *
 * @param categoryId 대분류 ID
 * @param subcategoryId 소분류 ID
 * @param limit 반환 개수 (기본 10개)
 * @returns AI 추천 목록
 */
export function getAIRecommendations(
  categoryId: number,
  subcategoryId: number,
  limit: number = 10
): AIRecommendation[] {
  const key = `${categoryId}-${subcategoryId}`;
  const recommendations = MOCK_AI_RECOMMENDATIONS[key] || [];

  // 점수 높은 순으로 정렬 후 limit만큼 반환
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 실제 API 연동 시 사용할 함수 (추후 구현)
 *
 * @param categoryId 대분류 ID
 * @param subcategoryId 소분류 ID
 * @param limit 반환 개수
 * @returns Promise<AIRecommendation[]>
 */
export async function fetchAIRecommendations(
  categoryId: number,
  subcategoryId: number,
  limit: number = 10
): Promise<AIRecommendation[]> {
  // TODO: 실제 백엔드 API 호출로 교체
  // const response = await fetch('/api/risk-assessment/recommend', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ categoryId, subcategoryId, limit })
  // });
  // return await response.json();

  // 현재는 Mock 데이터 반환
  return Promise.resolve(getAIRecommendations(categoryId, subcategoryId, limit));
}
