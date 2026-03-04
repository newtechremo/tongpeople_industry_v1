# 최초 위험성평가 개선 작업 계획

**작성일**: 2026-01-26
**브랜치**: `feature/14-risk-assessment-ui-improvements` (계속 사용)
**목표**: 최초 위험성평가를 기준으로 3가지 핵심 기능 추가

---

## 📋 배경 및 목표

### 현재 상황
- **최초 위험성평가** (InitialAssessmentForm): 474줄, 가장 완성도 높음
- **수시 위험성평가** (AdHocAssessmentForm): 267줄, 미완성 상태
- 수시 평가에는 이미 페이지네이션 + AI 추천 적용됨 (이번 작업에서)
- 최초 평가에는 적용 안 됨 (별도의 RiskFactorSelectModal 사용)

### 전략
1. **Phase 1**: 최초 위험성평가에 3가지 기능 추가
   - 소분류 검색
   - 위험요인 페이지네이션
   - AI 추천
2. **Phase 2**: 최초 평가 문서 및 구조 파악
3. **Phase 3**: 수시 평가를 최초 기반으로 재작성 (추후)

---

## 🎯 Phase 1: 최초 위험성평가 핵심 기능 추가

### 목표
최초 위험성평가를 완전한 기준으로 만들기 위해 3가지 기능 추가

### 작업 범위

#### 1. 소분류 검색 기능 추가
**대상 컴포넌트**: `SubcategoryCheckList`
**현재 상태**: 검색 기능 없음, 체크박스만
**작업 내용**:
- ✅ 이미 완료됨 (이번 작업에서 추가함)
- 검증만 필요

#### 2. 위험요인 페이지네이션 추가
**대상 컴포넌트**: `RiskFactorSelectModal`
**현재 상태**: 전체 목록 한 번에 표시
**작업 내용**:
- 페이지당 20개 표시
- 이전/다음 버튼
- 현재 페이지/총 페이지 표시
- 검색 시 첫 페이지로 리셋

**참고**: `RiskFactorSelector`에 이미 구현된 로직 참고

#### 3. AI 추천 기능 추가
**대상 컴포넌트**: `RiskFactorSelectModal`
**현재 상태**: AI 추천 없음
**작업 내용**:
- ai-recommendations.ts 연동
- AI 추천 섹션 (오렌지 배경)
- 배지 + 순위 + 점수 표시
- 추천 근거 표시
- 로딩 상태 처리 (500ms 시뮬레이션)

**참고**: `RiskFactorSelector`에 이미 구현된 UI 참고

---

## 📁 Phase 1 작업 파일

### 수정할 파일
1. `apps/admin-web/src/pages/risk-assessment/modals/RiskFactorSelectModal.tsx`
   - 페이지네이션 로직 추가
   - AI 추천 섹션 추가
   - UI 개선

### 참고할 파일
1. `apps/admin-web/src/components/risk-assessment/inputs/RiskFactorSelector.tsx`
   - 페이지네이션 구현 참고
   - AI 추천 UI 참고

2. `apps/admin-web/src/mocks/ai-recommendations.ts`
   - 이미 생성된 Mock 데이터 활용

---

## 🛠 Phase 1 상세 구현 계획

### Step 1: 현재 RiskFactorSelectModal 구조 분석
**예상 시간**: 30분

```typescript
// 현재 구조
- Mock 데이터: mockFactors (5개)
- 검색 기능: 있음 (searchQuery)
- 선택 방식: 체크박스 (selectedIds)
- 모드: 'search' | 'direct'
```

**확인 사항**:
- Props 구조
- 상태 관리 방식
- 검색 필터링 로직
- 제출 로직

### Step 2: 페이지네이션 추가
**예상 시간**: 1-1.5시간

**상태 추가**:
```typescript
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 20;
```

**페이지네이션 로직**:
```typescript
const totalPages = Math.ceil(filteredFactors.length / itemsPerPage);
const paginatedFactors = filteredFactors.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
```

**핸들러**:
```typescript
const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
const handleSearch = (query: string) => {
  setSearchQuery(query);
  setCurrentPage(1); // 검색 시 첫 페이지로
};
```

**UI 추가**:
```tsx
{filteredFactors.length > 0 && totalPages > 1 && (
  <div className="flex items-center justify-center gap-4 py-3 border-t-2 border-gray-200 mt-4">
    <button onClick={handlePrevPage} disabled={currentPage === 1}>
      ◀ 이전
    </button>
    <span>{currentPage} / {totalPages} 페이지</span>
    <button onClick={handleNextPage} disabled={currentPage === totalPages}>
      다음 ▶
    </button>
  </div>
)}
```

### Step 3: AI 추천 기능 통합
**예상 시간**: 1.5-2시간

**Import 추가**:
```typescript
import { getAIRecommendations, type AIRecommendation } from '@/mocks/ai-recommendations';
import { Loader2 } from 'lucide-react';
```

**상태 추가**:
```typescript
const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
const [isLoadingAI, setIsLoadingAI] = useState(false);
```

**AI 추천 로드**:
```typescript
useEffect(() => {
  if (isOpen && categoryId && subcategoryId) {
    loadMockAIRecommendations();
  }
}, [isOpen, categoryId, subcategoryId]);

const loadMockAIRecommendations = () => {
  setIsLoadingAI(true);
  setTimeout(() => {
    const recommendations = getAIRecommendations(categoryId, subcategoryId, 10);
    setAiRecommendations(recommendations);
    setIsLoadingAI(false);
  }, 500);
};
```

**UI 추가** (검색창 아래, 일반 목록 위):
```tsx
{/* AI 추천 섹션 */}
{aiRecommendations.length > 0 && !searchQuery && (
  <div className="mb-4">
    <h4 className="text-sm font-bold text-orange-600 mb-3">
      🤖 AI 추천 위험요인
    </h4>
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {aiRecommendations.map((rec, index) => (
        <label className="...오렌지 배경...">
          <input type="checkbox" ... />
          <div>
            <span className="badge">AI 추천 #{index + 1}</span>
            <span>{rec.score}점</span>
            <div>{rec.riskFactor}</div>
            <div>📊 {rec.reason}</div>
          </div>
        </label>
      ))}
    </div>
    <div className="mt-2 border-t-2"></div>
  </div>
)}

{/* 로딩 상태 */}
{isLoadingAI && !aiRecommendations.length && (
  <div className="p-8 text-center">
    <Loader2 className="animate-spin" />
    <p>AI가 추천 위험요인을 분석 중입니다...</p>
  </div>
)}

{/* 일반 위험요인 제목 */}
{aiRecommendations.length > 0 && !searchQuery && (
  <h4 className="text-sm font-bold text-slate-600 mb-3">일반 위험요인</h4>
)}
```

**주의사항**:
- AI 추천 항목도 `selectedIds`에 포함시켜야 함
- AI 추천 id는 9000번대, 일반 항목은 1~100번대로 구분
- Mock 데이터와 실제 mockFactors의 id 충돌 방지

### Step 4: 디자인 통일 및 테스트
**예상 시간**: 30분-1시간

**디자인 체크리스트**:
- [ ] RiskFactorSelector와 동일한 페이지네이션 UI
- [ ] AI 추천 섹션 오렌지 테마 일관성
- [ ] 배지 디자인 통일
- [ ] 버튼 스타일 통일

**테스트 시나리오**:
1. 최초 위험성평가 만들기 페이지 진입
2. 대분류 선택 → 소분류 선택
3. 위험요인 추가 버튼 클릭
4. AI 추천 로딩 확인 (500ms)
5. AI 추천 항목 표시 확인
6. 일반 위험요인 페이지네이션 확인 (20개씩)
7. 이전/다음 버튼 동작 확인
8. 검색 시 페이지 1로 리셋 확인
9. AI 추천 + 일반 항목 동시 선택 가능 확인
10. 선택 후 추가 버튼 클릭 → 정상 추가 확인

---

## 🎯 Phase 2: 최초 위험성평가 문서 파악

### 목표
현재 최초 위험성평가의 구조와 기능을 완전히 이해

### 작업 내용

#### 1. 기존 문서 검토
**파일 확인**:
```
docs/ui-specs/pc/specs/2026-01-20-최초위험성평가만들기-구현상세.md
docs/risk-assessment/위험성평가_기획서.md
docs/risk-assessment/위험성평가_개발명세서.md
```

**확인 사항**:
- 데이터 구조
- 필수 입력 항목
- 유효성 검사 규칙
- 제출 플로우
- API 명세 (예정)

#### 2. 코드 구조 분석
**InitialAssessmentForm.tsx (474줄) 분석**:
```
1. 상태 관리
   - categories: Category[]
   - activeCategory, activeSubcategory
   - Modal 상태들

2. 핸들러 함수
   - handleAddCategory
   - handleCategoryChange
   - handleSubcategoryToggle
   - handleAddRiskFactor
   - handleSubmit

3. 컴포넌트 구조
   - BasicInfoSection
   - CategoryItem (반복)
     - SubcategoryCheckList
     - RiskFactorCard (반복)
   - 모달들
```

#### 3. 개선 필요 영역 식별
**예상 개선 사항**:
- [ ] 중복 코드 제거
- [ ] 상태 관리 단순화
- [ ] 타입 안전성 강화
- [ ] 컴포넌트 분리
- [ ] 에러 처리 개선

---

## 🎯 Phase 3: 수시 위험성평가 재작성 (추후)

### 목표
최초 위험성평가를 기반으로 수시 평가 재작성

### 전략

#### 1. 공통 컴포넌트 추출
**새로운 공통 컴포넌트**:
```
components/risk-assessment/shared/
├── AssessmentFormLayout.tsx      # 공통 레이아웃
├── CategorySelector.tsx           # 대분류 선택
├── SubcategorySelector.tsx        # 소분류 선택
├── RiskFactorManager.tsx          # 위험요인 관리
└── AssessmentSubmitSection.tsx   # 제출 섹션
```

#### 2. 타입 공통화
**shared 패키지로 이동**:
```typescript
// packages/shared/src/types/risk-assessment.ts
export interface RiskFactor { ... }
export interface Subcategory { ... }
export interface Category { ... }
export interface AssessmentFormData { ... }
```

#### 3. 수시 평가 특화 기능
**수시만의 차이점**:
- 수시 사유 입력 (TriggerReasonFieldset)
- 작업 기간 입력 (WorkPeriodFieldset)
- 빈도/강도 평가 (FrequencyIntensityFieldset)

**재작성 방식**:
```tsx
// 새로운 AdHocAssessmentForm
export default function AdHocAssessmentForm() {
  return (
    <AssessmentFormLayout type="adhoc">
      <BasicInfoSection />
      <TriggerReasonFieldset />      {/* 수시 전용 */}
      <WorkPeriodFieldset />          {/* 수시 전용 */}
      <CategorySelector />            {/* 공통 */}
      <SubcategorySelector />         {/* 공통 */}
      <RiskFactorManager />           {/* 공통 */}
      <FrequencyIntensityFieldset />  {/* 수시 전용 */}
      <AssessmentSubmitSection />     {/* 공통 */}
    </AssessmentFormLayout>
  );
}
```

---

## 📊 예상 일정

### Phase 1: 최초 평가 기능 추가
| 단계 | 작업 | 예상 시간 |
|------|------|-----------|
| Step 1 | 구조 분석 | 30분 |
| Step 2 | 페이지네이션 추가 | 1-1.5시간 |
| Step 3 | AI 추천 통합 | 1.5-2시간 |
| Step 4 | 디자인 통일 및 테스트 | 30분-1시간 |
| **합계** | | **3.5-5시간** |

### Phase 2: 문서 파악
| 단계 | 작업 | 예상 시간 |
|------|------|-----------|
| 문서 검토 | 기존 문서 읽기 | 1시간 |
| 코드 분석 | InitialAssessmentForm 분석 | 1-2시간 |
| 개선 계획 | 리팩토링 계획 수립 | 1시간 |
| **합계** | | **3-4시간** |

### Phase 3: 수시 평가 재작성 (추후)
| 단계 | 작업 | 예상 시간 |
|------|------|-----------|
| 공통 컴포넌트 | 추출 및 리팩토링 | 4-6시간 |
| 수시 재작성 | 새로운 AdHocAssessmentForm | 2-3시간 |
| 테스트 | 통합 테스트 | 1-2시간 |
| **합계** | | **7-11시간** |

---

## 🚨 주의사항

### Phase 1 작업 시
1. **기존 기능 보존**
   - RiskFactorSelectModal의 'direct' 모드 유지
   - 커스텀 소분류 처리 로직 유지
   - existingFactors 중복 제거 로직 유지

2. **Mock 데이터 통합**
   - ai-recommendations.ts의 id는 9000번대
   - mockFactors의 id는 1~100번대
   - selectedIds는 두 타입 모두 포함

3. **디자인 일관성**
   - RiskFactorSelector와 동일한 UI
   - 오렌지 테마 유지
   - 배지/버튼 스타일 통일

### Phase 2 작업 시
1. **기존 기능 파악 우선**
   - 섣부른 리팩토링 지양
   - 모든 기능 완전히 이해 후 계획 수립

2. **문서화 철저**
   - 발견한 모든 로직 문서화
   - 개선 필요 영역 명확히 정리

### Phase 3 작업 시
1. **점진적 마이그레이션**
   - 한 번에 모두 바꾸지 말고 단계적으로
   - 각 단계마다 테스트

2. **하위 호환성 유지**
   - 기존 데이터 구조 유지
   - API 호출 형식 유지

---

## ✅ 성공 기준

### Phase 1
- [ ] 소분류 검색 정상 동작
- [ ] 위험요인 페이지네이션 20개씩 표시
- [ ] AI 추천 항목 상단 표시 (오렌지 배경)
- [ ] 페이지 이동 정상 동작
- [ ] 검색 시 페이지 1로 리셋
- [ ] AI 추천 + 일반 항목 동시 선택 가능
- [ ] 디자인 일관성 유지
- [ ] 기존 기능 모두 정상 동작

### Phase 2
- [ ] 모든 문서 검토 완료
- [ ] InitialAssessmentForm 코드 완전히 이해
- [ ] 개선 계획 문서 작성
- [ ] 리팩토링 우선순위 결정

### Phase 3 (추후)
- [ ] 공통 컴포넌트 정상 동작
- [ ] 수시 평가 정상 작성 가능
- [ ] 최초/수시 모두 동일한 UX
- [ ] 코드 중복 50% 이상 감소
- [ ] 타입 안전성 100%

---

## 🔄 작업 플로우

### Phase 1 실행 단계
```
1. RiskFactorSelectModal.tsx 읽기
   ↓
2. 페이지네이션 로직 추가
   ↓
3. AI 추천 상태 및 로직 추가
   ↓
4. UI 섹션 추가 (AI 추천)
   ↓
5. 디자인 조정 및 통일
   ↓
6. 브라우저 테스트
   ↓
7. 커밋
```

### Phase 2 실행 단계
```
1. 문서 읽기 (3개 파일)
   ↓
2. InitialAssessmentForm.tsx 정독
   ↓
3. 각 함수/컴포넌트 역할 정리
   ↓
4. 개선 필요 영역 식별
   ↓
5. 리팩토링 계획 문서 작성
   ↓
6. 사용자와 논의 후 Phase 3 계획 수립
```

---

## 📝 변경 로그 (작업 후 작성)

### Phase 1
- [ ] RiskFactorSelectModal 페이지네이션 추가
- [ ] RiskFactorSelectModal AI 추천 통합
- [ ] 디자인 통일
- [ ] 테스트 완료

### Phase 2
- [ ] 문서 검토 완료
- [ ] 코드 분석 완료
- [ ] 개선 계획 수립

### Phase 3 (추후)
- [ ] 공통 컴포넌트 추출
- [ ] 수시 평가 재작성
- [ ] 통합 테스트

---

**작성자**: Prometheus (Planning Agent)
**승인 대기**: 사용자 확인 후 Phase 1 실행
**다음 단계**: Phase 1 → Phase 2 → 사용자와 논의 → Phase 3
