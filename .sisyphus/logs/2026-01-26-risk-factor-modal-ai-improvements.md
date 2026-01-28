# 위험요인 선택 모달 AI 추천 및 UI 개선

**작업일**: 2026-01-26
**브랜치**: feature/14-risk-assessment-ui-improvements
**작업자**: Claude Code

## 작업 개요

최초 위험성평가(Initial Risk Assessment) 기능 개선 Phase 1의 일환으로 위험요인 선택 모달에 AI 추천, 페이지네이션, 검색 기능을 구현하고 레이아웃 오버플로우 문제를 해결했습니다.

## 주요 변경사항

### 1. RiskFactorSelectModal.tsx - AI 추천 기능 구현

**파일**: `apps/admin-web/src/pages/risk-assessment/modals/RiskFactorSelectModal.tsx`

#### 추가된 기능

1. **AI 추천 위험요인 표시**
   - 선택된 카테고리/소분류에 맞는 AI 추천 위험요인 자동 로딩
   - 로딩 스피너 애니메이션 (Loader2 아이콘)
   - 추천 점수 기반 정렬 (0-100점)
   - 오렌지 그라데이션 카드 디자인
   - 재해유형, 추천 근거 표시

2. **페이지네이션**
   - 일반 위험요인 목록을 페이지당 20개씩 분할
   - 이전/다음 버튼과 현재 페이지 표시
   - 검색 시 자동으로 1페이지로 리셋

3. **레이아웃 개선**
   - 스크롤 가능한 콘텐츠 영역 추가 (`flex-1 overflow-y-auto`)
   - 헤더/탭과 버튼은 고정, 중간 콘텐츠만 스크롤
   - 모달 높이 `max-h-[80vh]` 내에서 모든 요소가 표시되도록 구조 개선

#### 기술적 구현 세부사항

**상태 관리**
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
const [isLoadingAI, setIsLoadingAI] = useState(false);
const itemsPerPage = 20;
```

**AI 추천 로딩 useEffect**
```typescript
useEffect(() => {
  if (isOpen && categoryId !== undefined && subcategoryId !== undefined && !isCustomSubcategory) {
    loadMockAIRecommendations();
  } else {
    setAiRecommendations([]);
  }
}, [isOpen, categoryId, subcategoryId, isCustomSubcategory]);
```

**페이지네이션 계산**
```typescript
const totalPages = Math.ceil(filteredFactors.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedFactors = filteredFactors.slice(startIndex, endIndex);
```

**제출 시 AI + 일반 위험요인 통합**
```typescript
const aiFactors = aiRecommendations
  .filter(ai => selectedIds.includes(ai.id))
  .map(ai => ({ factor: ai.riskFactor, improvement: ai.improvement }));

const regularFactors = mockFactors
  .filter(f => selectedIds.includes(f.id))
  .map(f => ({ factor: f.factor, improvement: f.improvement }));

result = [...aiFactors, ...regularFactors];
```

### 2. ai-recommendations.ts - Mock 데이터 확장

**파일**: `apps/admin-web/src/mocks/ai-recommendations.ts`

카테고리 3(제조업) 소분류 101~105에 대한 AI 추천 데이터 추가:
- `'3-101'`: 6개 추천 위험요인
- `'3-102'`: 4개 추천 위험요인
- `'3-103'`: 4개 추천 위험요인
- `'3-104'`: 3개 추천 위험요인
- `'3-105'`: 3개 추천 위험요인

**데이터 구조 예시**
```typescript
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
  // ...
]
```

### 3. AdHocAssessmentForm.tsx - 기존 변경사항 유지

**파일**: `apps/admin-web/src/components/risk-assessment/forms/AdHocAssessmentForm.tsx`

수시 위험성평가 폼의 기존 개선사항 유지 (이전 커밋에서 변경됨)

## UI/UX 개선사항

### 모달 레이아웃 구조
```
┌─────────────────────────────┐
│ 헤더 + 닫기 버튼             │ ← 고정
│ 제목: 위험요인 선택          │
│ 탭: [목록 선택] [직접 입력]  │
├─────────────────────────────┤
│ ╔═══════════════════════╗  │
│ ║ 🔍 검색바              ║  │
│ ║                       ║  │
│ ║ 🤖 AI 추천 위험요인    ║  │
│ ║ • 점수 배지           ║  │ ← 스크롤 가능
│ ║ • 오렌지 그라데이션   ║  │   영역
│ ║ • 재해유형 표시       ║  │
│ ║                       ║  │
│ ║ 📋 일반 위험요인      ║  │
│ ║ • 20개씩 페이징       ║  │
│ ║ • 체크박스 선택       ║  │
│ ║                       ║  │
│ ║ ◀ 이전 1/5 다음 ▶    ║  │
│ ╚═══════════════════════╝  │
├─────────────────────────────┤
│ N개 선택됨   [취소] [선택완료] │ ← 고정
└─────────────────────────────┘
```

### 디자인 시스템 준수

**AI 추천 카드**
- 배경: `bg-gradient-to-r from-orange-50 to-white`
- 테두리: `border-2 border-orange-100` → 호버 시 `border-orange-300`
- 점수 배지: `bg-orange-100 text-orange-600`
- 체크박스: `text-orange-500 focus:ring-orange-500`

**일반 위험요인 목록**
- 배경: `bg-white` → 호버 시 `bg-orange-50`
- 테두리: `border-gray-200`
- 체크박스: `text-orange-500`

**페이지네이션 버튼**
- 기본: `border border-gray-300 hover:bg-gray-50`
- 비활성: `disabled:opacity-50 disabled:cursor-not-allowed`

## 해결된 이슈

### 1. Mock 데이터 부족 문제
**증상**: 카테고리 3 선택 시 AI 추천 결과 0개
**원인**: `ai-recommendations.ts`에 카테고리 1, 2만 존재
**해결**: 카테고리 3 소분류 101~105 데이터 추가

### 2. Falsy 값 처리 문제
**증상**: categoryId 또는 subcategoryId가 0일 때 useEffect 미실행
**원인**: `if (categoryId && subcategoryId)` 조건이 0을 falsy로 간주
**해결**: `if (categoryId !== undefined && subcategoryId !== undefined)` 로 변경

### 3. 모달 콘텐츠 오버플로우
**증상**: AI 추천 + 일반 목록이 길어지면 모달 밖으로 넘침, 버튼이 화면 밖으로 사라짐
**원인**: 고정 높이 없이 콘텐츠가 무한정 늘어남
**해결**:
- 모달 컨테이너: `max-h-[80vh] flex flex-col`
- 콘텐츠 영역: `flex-1 overflow-y-auto` (스크롤 가능)
- 헤더/버튼: 고정 위치 유지

### 4. JSX 구조 에러 방지
**문제**: 여러 번 시도했던 `<div>` 래퍼 추가 시 JSX 닫기 태그 오류 발생
**해결**: 한 번에 전체 구조를 정확히 파악하여 올바른 위치에 래퍼 추가

## 테스트 확인사항

- [x] AI 추천 로딩 스피너 표시
- [x] 카테고리 3 소분류 101~105 선택 시 AI 추천 정상 표시
- [x] AI 추천 + 일반 위험요인 중복 선택 가능
- [x] 페이지네이션 정상 동작 (20개씩, 이전/다음)
- [x] 검색 시 페이지 1로 리셋
- [x] 모달 스크롤 정상 동작, 버튼 항상 보임
- [x] 선택 완료 시 AI + 일반 위험요인 모두 제출
- [x] HMR (Hot Module Replacement) 정상 작동

## 향후 작업

Phase 1 완료 후 예정:
- [ ] 실제 백엔드 API 연동 (Mock 데이터 대체)
- [ ] AI 추천 알고리즘 고도화
- [ ] 중복 위험요인 자동 필터링
- [ ] 즐겨찾기/최근 사용 위험요인 기능

## 참고사항

### 콘솔 로그
디버깅을 위해 AI 추천 로딩 시 콘솔 로그 출력:
```
🔍 AI 추천 요청: {categoryId: 3, subcategoryId: 101, key: '3-101'}
📊 AI 추천 결과: 6 개 [...]
```

### 성능 고려사항
- Mock 데이터 로딩에 800ms 딜레이 추가 (실제 API 응답 시간 시뮬레이션)
- 페이지네이션으로 렌더링 성능 최적화 (한 번에 최대 20개만 렌더)
- AI 추천 ID는 9000번대, 일반 위험요인 ID는 1~1000번대로 분리

---

**작업 완료**: 2026-01-26 11:43
**커밋 대상 파일**:
- `apps/admin-web/src/pages/risk-assessment/modals/RiskFactorSelectModal.tsx`
- `apps/admin-web/src/mocks/ai-recommendations.ts`
