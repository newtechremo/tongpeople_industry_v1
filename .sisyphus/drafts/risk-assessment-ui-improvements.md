# 위험성평가 UI 개선 작업 계획

**작성일**: 2026-01-26
**브랜치**: `feature/12-risk-assessment-approval-line`
**목표**: 대규모 데이터 대응 + AI 추천 기능 통합

---

## 📋 요구사항 요약

### 현재 문제점
1. **소분류**: Mock 5개만 표시, 검색 없음 → 200개+ 데이터 대응 불가
2. **위험요인 모달**: 전체 목록 한 번에 표시 → 스크롤 길어질 우려
3. **AI 추천**: 기존 Python 엔진 있으나 UI에 미연동

### 개선 목표
1. ✅ 소분류 검색 기능 추가
2. ✅ 위험요인 모달 페이지네이션 (20개씩)
3. ✅ AI 추천 기능 UI 통합
4. ✅ 디자인 일관성 유지 (오렌지 그라데이션 테마)

---

## 🎯 작업 범위

### Phase 1: 소분류 검색 기능 추가
**예상 소요**: 1-2시간
**우선순위**: HIGH

**현재 구조**:
```tsx
// SubcategoryCheckList.tsx
- 체크박스 리스트만 표시
- Mock 데이터 5개
- 검색 기능 없음
```

**개선 후**:
```tsx
- 검색창 추가 (대분류와 유사한 UI)
- 실시간 필터링
- 검색 결과 없을 때 안내 메시지
- 체크박스 리스트 유지
```

---

### Phase 2: 위험요인 모달 페이지네이션
**예상 소요**: 2-3시간
**우선순위**: HIGH

**현재 구조**:
```tsx
// RiskFactorSelector.tsx
- 모달 + 검색 + 체크박스
- 전체 목록 한 번에 표시
- filteredFactors.map() 전체 렌더링
```

**개선 후**:
```tsx
- 페이지당 20개 표시
- 이전/다음 버튼
- 현재 페이지/총 페이지 표시
- 검색 시 페이지 1로 리셋
```

**UI 예시**:
```
┌─────────────────────────────────────────┐
│ 위험요인 선택                    [닫기]  │
├─────────────────────────────────────────┤
│ [🔍 검색창]                             │
├─────────────────────────────────────────┤
│ ☐ 위험요인 1                            │
│ ☐ 위험요인 2                            │
│ ...                                     │
│ ☐ 위험요인 20                           │
├─────────────────────────────────────────┤
│ [◀ 이전]  1 / 25 페이지  [다음 ▶]      │
├─────────────────────────────────────────┤
│ 5개 선택됨          [취소] [추가 (5)]   │
└─────────────────────────────────────────┘
```

---

### Phase 3: AI 추천 기능 UI (Mock 데이터)
**예상 소요**: 2시간
**우선순위**: MEDIUM

> ⚠️ **주의**: 실제 백엔드 API 연동은 다른 개발자가 추후 진행
> 현재는 Mock 데이터로 UI 프로토타입만 구현

#### 3.1 Mock 데이터 정의
**파일**: `apps/admin-web/src/mocks/ai-recommendations.ts` (새 파일)

**Mock 데이터 구조**:
```typescript
export interface AIRecommendation {
  id: number;
  taskName: string;        // 작업명
  riskFactor: string;      // 위험요인
  accidentType: string;    // 재해형태
  score: number;           // 추천 점수 (0-100)
  reason: string;          // 추천 근거
  improvement: string;     // 개선대책
}

// Mock 데이터 예시
export const MOCK_AI_RECOMMENDATIONS: Record<string, AIRecommendation[]> = {
  // 키: "{categoryId}-{subcategoryId}"
  "1-101": [ // 건설업 - 가설전선 설치작업
    {
      id: 9001,
      taskName: "가설전선 설치작업",
      riskFactor: "안전대를 사용하지 않고 고소부위 작업중 추락",
      accidentType: "떨어짐",
      score: 90,
      reason: "작업명 '가설전선' 매칭(40) + 고위험 '떨어짐'(30) + 복합매칭(20)",
      improvement: "고소부위 작업시 안전대 고리 체결 철저"
    },
    {
      id: 9002,
      taskName: "전선작업",
      riskFactor: "전선 접촉으로 인한 감전",
      accidentType: "감전",
      score: 70,
      reason: "위험요인 '전선' 매칭(20) + 고위험 '감전'(30) + 복합매칭(20)",
      improvement: "절연장갑 착용 및 전원 차단 후 작업"
    },
    // ... 더 많은 항목
  ],
  "1-102": [ // 건설업 - 가설전선 점검작업
    // ...
  ]
};

// 카테고리/소분류 조합으로 추천 조회
export function getAIRecommendations(
  categoryId: number,
  subcategoryId: number,
  limit: number = 10
): AIRecommendation[] {
  const key = `${categoryId}-${subcategoryId}`;
  const recommendations = MOCK_AI_RECOMMENDATIONS[key] || [];
  return recommendations.slice(0, limit);
}
```

#### 3.2 프론트엔드 UI 구현
**파일**: `apps/admin-web/src/components/risk-assessment/inputs/RiskFactorSelector.tsx`

**UI 개선**:
```tsx
// 상단: AI 추천 항목 (오렌지 배경)
┌─────────────────────────────────────────┐
│ 🤖 AI 추천 위험요인                     │
├─────────────────────────────────────────┤
│ ☐ [#1 90점] 안전대 미착용 추락          │
│   → 작업명 '가설전선' 매칭(40) + ...    │
│ ☐ [#2 70점] 감전 사고                   │
│   → 위험요인 '전선' 매칭(20) + ...      │
├─────────────────────────────────────────┤
│ 일반 위험요인                            │
├─────────────────────────────────────────┤
│ ☐ 기타 위험요인 1                        │
│ ☐ 기타 위험요인 2                        │
└─────────────────────────────────────────┘
```

**기능**:
1. 모달 열릴 때 자동으로 AI 추천 API 호출
2. 로딩 스피너 표시
3. AI 추천 항목을 상단에 배치 (오렌지 배경 + 배지)
4. 스코어 및 추천 근거 표시
5. 일반 목록과 구분선으로 분리

---

## 🛠 기술 스펙

### 상태 관리
```typescript
// RiskFactorSelector.tsx
const [currentPage, setCurrentPage] = useState(1);
const [aiRecommendations, setAiRecommendations] = useState<RiskFactorOption[]>([]);
const [isLoadingAI, setIsLoadingAI] = useState(false);

const itemsPerPage = 20;
const totalPages = Math.ceil(filteredFactors.length / itemsPerPage);
const paginatedFactors = filteredFactors.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
```

### 페이지네이션 핸들러
```typescript
const handlePrevPage = () => {
  setCurrentPage(prev => Math.max(1, prev - 1));
};

const handleNextPage = () => {
  setCurrentPage(prev => Math.min(totalPages, prev + 1));
};

const handleSearch = (query: string) => {
  setSearchQuery(query);
  setCurrentPage(1); // 검색 시 첫 페이지로
};
```

### AI 추천 Mock 데이터 로드
```typescript
import { getAIRecommendations } from '@/mocks/ai-recommendations';

useEffect(() => {
  if (isOpen && !isCustomSubcategory) {
    loadMockAIRecommendations();
  }
}, [isOpen, categoryId, subcategoryId]);

const loadMockAIRecommendations = () => {
  setIsLoadingAI(true);

  // Mock 데이터 로딩 시뮬레이션 (500ms 지연)
  setTimeout(() => {
    const recommendations = getAIRecommendations(categoryId, subcategoryId, 10);
    setAiRecommendations(recommendations);
    setIsLoadingAI(false);
  }, 500);
};

// 추후 실제 API로 교체 시:
// const fetchAIRecommendations = async () => {
//   setIsLoadingAI(true);
//   try {
//     const response = await fetch('/api/risk-assessment/recommend', {
//       method: 'POST',
//       body: JSON.stringify({ categoryId, subcategoryId, limit: 10 })
//     });
//     const data = await response.json();
//     setAiRecommendations(data.recommendations);
//   } catch (error) {
//     console.error('AI 추천 실패:', error);
//   } finally {
//     setIsLoadingAI(false);
//   }
// };
```

---

## 📁 파일 변경 사항

### 수정할 파일
1. `apps/admin-web/src/pages/risk-assessment/components/SubcategoryCheckList.tsx`
   - 검색창 추가
   - 필터링 로직 구현

2. `apps/admin-web/src/components/risk-assessment/inputs/RiskFactorSelector.tsx`
   - 페이지네이션 로직 추가
   - AI 추천 API 연동
   - UI 개선 (AI 추천 섹션 추가)

### 새로 생성할 파일
3. `apps/admin-web/src/mocks/ai-recommendations.ts`
   - AI 추천 Mock 데이터
   - `getAIRecommendations()` 함수

4. `apps/admin-web/src/hooks/useAIRecommendations.ts` (선택사항)
   - AI 추천 로직 커스텀 훅 분리
   - 추후 실제 API 교체 용이

---

## 🎨 디자인 가이드

### 소분류 검색창
```tsx
<div className="relative mb-3">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="소분류 검색..."
    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
  />
</div>
```

### 페이지네이션 UI
```tsx
<div className="flex items-center justify-center gap-4 py-3 border-t-2 border-gray-200">
  <button
    onClick={handlePrevPage}
    disabled={currentPage === 1}
    className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    ◀ 이전
  </button>

  <span className="text-sm text-slate-600">
    <span className="font-bold text-orange-600">{currentPage}</span> / {totalPages} 페이지
  </span>

  <button
    onClick={handleNextPage}
    disabled={currentPage === totalPages}
    className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    다음 ▶
  </button>
</div>
```

### AI 추천 항목 배지
```tsx
<div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-3">
  <div className="flex items-start gap-3">
    <input type="checkbox" ... />
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
          🤖 AI 추천 #{rank}
        </span>
        <span className="text-xs text-orange-700 font-medium">
          {score}점
        </span>
      </div>
      <div className="font-bold text-slate-800">{riskFactor}</div>
      <div className="text-xs text-slate-500 mt-1">
        📊 {reason}
      </div>
    </div>
  </div>
</div>
```

---

## ✅ 테스트 시나리오

### 소분류 검색
1. 대분류 선택 → 소분류 목록 표시
2. 검색창에 "가설" 입력
3. "가설전선 설치작업", "가설전선 점검작업"만 표시
4. 검색 결과 없을 때 안내 메시지 확인

### 위험요인 페이지네이션
1. 위험요인 추가 버튼 클릭
2. 첫 페이지 (1-20개) 표시 확인
3. "다음" 버튼 클릭 → 2페이지 (21-40개)
4. "이전" 버튼 클릭 → 1페이지로 복귀
5. 마지막 페이지에서 "다음" 버튼 비활성화 확인
6. 검색 시 페이지 1로 리셋 확인

### AI 추천
1. 대분류 "건설업", 소분류 "가설전선 설치작업" 선택
2. 위험요인 추가 모달 열기
3. AI 추천 로딩 스피너 확인
4. AI 추천 항목 상단 표시 (오렌지 배경)
5. 스코어 높은 순 정렬 확인
6. 추천 근거 표시 확인
7. AI 추천 + 일반 항목 구분선 확인
8. AI 추천 항목 체크 후 추가 가능 확인

---

## 🚨 주의사항

### Mock 데이터 설계
- 실제 API와 동일한 인터페이스 사용
- 추후 백엔드 개발자가 쉽게 교체할 수 있도록 구조화
- Mock 데이터에 충분한 예시 포함 (각 조합마다 5-10개)

### 실제 API 연동 준비사항 (백엔드 개발자용)
**추후 구현 필요**:
1. Python `recommender.py` 호출 API 엔드포인트
2. SQLite DB `safety_master.db` 연동
3. 스코어링 알고리즘 적용
4. DB 경로: `packages/shared/data/safety_master.db`

**프론트엔드 수정 필요**:
- `getAIRecommendations()` Mock 함수 → 실제 API 호출로 교체
- 에러 처리 추가 (네트워크 오류, 타임아웃)

### 성능 최적화
- Mock 데이터 로딩 지연 시뮬레이션 (500ms) → 로딩 UX 테스트
- 페이지네이션으로 DOM 노드 수 제한
- AI 추천은 모달 열릴 때 한 번만 로드

### 에러 처리
- AI 추천 Mock 데이터 없을 시에도 일반 목록은 표시
- 빈 검색 결과 안내 메시지

---

## 📦 Dependencies

### 프론트엔드 (이미 설치됨)
```json
{
  "lucide-react": "^0.263.1"
}
```

### 백엔드 (추후 다른 개발자가 구현)
- Python 3.8+
- SQLite3
- `recommender.py` 실행 환경
- FastAPI 또는 Express.js (Python 호출용)

---

## 🔄 마이그레이션 전략

### Mock → Real DB
현재는 Mock 데이터로 개발하되, 향후 Real DB 연동 시:
1. API 엔드포인트만 교체
2. 프론트엔드 코드는 변경 없음
3. TypeScript 인터페이스 유지

### AI 추천 학습 데이터 확장
- 초기: `safety_master.db` 기존 데이터 활용
- 중기: 사용자 선택 패턴 수집 → 재학습
- 장기: GPT API 연동 고려

---

## 📊 성공 지표

### 사용성 개선
- ✅ 소분류 검색 시 0.5초 이내 반응
- ✅ 페이지네이션으로 모달 로딩 속도 50% 향상
- ✅ AI 추천 상위 3개 중 1개 이상 선택률 30%+

### 코드 품질
- ✅ TypeScript strict 모드 에러 없음
- ✅ 재사용 가능한 컴포넌트 구조
- ✅ 디자인 시스템 일관성 유지

---

## 🎯 실행 계획

### Step 1: 소분류 검색 (1-2시간)
1. `SubcategoryCheckList.tsx` 수정
2. 검색창 UI 추가
3. 필터링 로직 구현
4. 브라우저 테스트

### Step 2: 위험요인 페이지네이션 (2-3시간)
1. `RiskFactorSelector.tsx` 수정
2. 페이지네이션 상태 관리 추가
3. 이전/다음 버튼 UI 구현
4. 검색 연동 (검색 시 페이지 1로)
5. 브라우저 테스트

### Step 3: AI 추천 Mock 데이터 생성 (30분)
1. `apps/admin-web/src/mocks/ai-recommendations.ts` 생성
2. Mock 데이터 구조 정의 (AIRecommendation 인터페이스)
3. 여러 카테고리/소분류 조합에 대한 예시 데이터 작성
4. `getAIRecommendations()` 함수 구현

### Step 4: AI 추천 UI 통합 (1.5시간)
1. API 호출 로직 추가
2. AI 추천 UI 섹션 구현
3. 로딩 상태 처리
4. 에러 처리
5. 브라우저 테스트

### Step 5: 통합 테스트 (1시간)
1. 전체 플로우 테스트
2. 엣지 케이스 확인
3. 성능 측정
4. 버그 수정

### Step 6: 커밋 및 문서화 (30분)
1. Git 커밋 (의미 있는 단위로)
2. 체인지로그 작성
3. README 업데이트

---

## 📝 변경 로그 (작업 후 작성)

- [ ] 소분류 검색 기능 추가
- [ ] 위험요인 모달 페이지네이션 구현
- [ ] AI 추천 Mock 데이터 생성
- [ ] AI 추천 UI 통합 (Mock 데이터 기반)
- [ ] 디자인 일관성 검토
- [ ] 테스트 완료

## 🔮 향후 작업 (다른 개발자)

- [ ] Python `recommender.py` 호출 백엔드 API 구현
- [ ] SQLite DB `safety_master.db` 연동
- [ ] 실제 스코어링 알고리즘 적용
- [ ] 프론트엔드 Mock → Real API 교체
- [ ] 성능 최적화 (캐싱, 인덱싱)
- [ ] 사용자 선택 패턴 학습 기능

---

**작성자**: Prometheus (Planning Agent)
**승인 대기**: 사용자 확인 후 Sisyphus 실행
**백엔드 연동**: 추후 다른 개발자가 진행
