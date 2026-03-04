# Gap Analysis: 수시 vs 최초/정기 위험성평가

**작성일**: 2025-02-20
**목적**: 수시 위험성평가의 개선사항을 최초/정기에 이관하기 위한 구조 차이 분석

---

## 1. 파일 구조 비교

| 구분 | 수시 (Occasional) | 최초/정기 (Initial/Regular) |
|------|-------------------|----------------------------|
| **폼 파일** | `OccasionalAssessmentForm_Workflow.tsx` | `InitialAssessmentForm.tsx` |
| **타입 파일** | `types/occasional.ts` | 없음 (폼 내부 정의) |
| **검증 파일** | `validation/occasional.ts` | 없음 |
| **워크플로우 훅** | `hooks/useWorkflow.ts` | 없음 |
| **컴포넌트** | `OccasionalCategoryItem.tsx`<br>`OccasionalRiskFactorCard.tsx` | `CategoryItem.tsx`<br>`RiskFactorCard.tsx` |

---

## 2. 데이터 모델 비교

### 2.1 위험요인 (RiskFactor)

| 필드 | 수시 | 최초/정기 | 차이점 |
|------|------|-----------|--------|
| **기본 필드** | ✅ id, factor, improvement, workPeriodStart, workPeriodEnd | ✅ 동일 | - |
| **상중하 방식** | ✅ level (옵션) | ✅ level (필수) | 수시는 LEVEL/FREQUENCY_INTENSITY 선택 가능 |
| **빈도강도 방식** | ✅ beforeFrequency, beforeIntensity, beforeRiskScore, beforeGradeLevel<br>✅ afterFrequency, afterIntensity, afterRiskScore, afterGradeLevel | ❌ 없음 | **최초/정기는 상중하만 지원** |
| **조치 정보** | ❌ 없음 (소분류 레벨) | ❌ 없음 | - |

**타입 정의**:

```typescript
// 수시
export type OccasionalRiskFactor = RiskFactorLevel | RiskFactorFrequencyIntensity;

// 최초/정기
interface RiskFactor {
  id: string;
  factor: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW' | null;  // 상중하만
  improvement: string;
  workPeriodStart: string;
  workPeriodEnd: string;
}
```

### 2.2 소분류 (Subcategory)

| 필드 | 수시 | 최초/정기 | 차이점 |
|------|------|-----------|--------|
| **기본 필드** | ✅ id, name, isCustom, riskFactors | ✅ 동일 | - |
| **조치 정보** | ✅ actionDate, actionAssigneeIds, actionConfirmerIds | ❌ 없음 | **수시만 소분류별 조치 관리** |
| **검토 내용** | ✅ reviewComments (옵션) | ❌ 없음 | - |

### 2.3 대분류 (Category)

| 필드 | 수시 | 최초/정기 | 차이점 |
|------|------|-----------|--------|
| **기본 필드** | ✅ id, categoryId, categoryName, subcategories | ✅ 동일 | - |

### 2.4 Payload

| 필드 | 수시 | 최초/정기 | 차이점 |
|------|------|-----------|--------|
| **기본 정보** | siteName, companyName, teamId, approvalLineId, workPeriodStart, workPeriodEnd | siteName, companyName, approvalLineId, workPeriodStart, workPeriodEnd | **수시만 teamId 있음** (최초/정기는 'all' 고정?) |
| **수시 전용** | ✅ triggerReason, triggerDate | ❌ 없음 | 수시 평가 사유/발생일 |
| **위험성 방식** | ✅ riskMethod ('LEVEL' \| 'FREQUENCY_INTENSITY') | ❌ 없음 | **최초/정기는 상중하 고정** |
| **데이터** | categories | categories | 동일 |

---

## 3. 워크플로우 비교

### 3.1 작성 단계

| 단계 | 수시 (v2.0 - 통합 카드) | 최초/정기 | 차이점 |
|------|------------------------|-----------|--------|
| **1단계** | **기본/수시 정보** (통합 카드)<br>- siteName, companyName, teamId, approvalLineId<br>- workPeriodStart, workPeriodEnd<br>- triggerReason, triggerDate (선택) | 기본 정보<br>- siteName, companyName, approvalLineId<br>- workPeriodStart, workPeriodEnd | 수시만 teamId + 수시정보 통합 |
| **2단계** | **위험성 산정 방식**<br>- LEVEL/FREQUENCY_INTENSITY 선택 | ❌ 없음 | 최초/정기는 상중하 고정 |
| **3단계** | **작업 공종**<br>- categories, subcategories, riskFactors | 작업 공종 (동일) | 동일 |

**수시 v2.0 변경사항** (2025-02-20):
- ✅ 4단계 → **3단계**로 단축
- ✅ 1번 섹션에 기본정보 + 수시정보 **통합**
- ✅ 진행률 헤더 이동
- ✅ 컴팩트 UI 적용

**결론**: 최초/정기는 **2단계가 없음** → **2-3단계 워크플로우** 예상

### 3.2 상태 관리

| 항목 | 수시 | 최초/정기 | 차이점 |
|------|------|-----------|--------|
| **워크플로우 상태** | ✅ useWorkflow (locked/active/completed/error) | ❌ 없음 | **최초/정기는 단일 화면 폼** |
| **섹션 확장** | ✅ 아코디언 순차 확장 | ❌ 없음 | 모두 펼쳐진 상태 |
| **진행률 표시** | ✅ WorkflowProgress | ❌ 없음 | - |
| **자동 스크롤** | ✅ useAutoScroll | ❌ 없음 | - |

---

## 4. UI/UX 비교

### 4.1 위험요인 입력

| 항목 | 수시 | 최초/정기 | 차이점 |
|------|------|-----------|--------|
| **카드 컴포넌트** | OccasionalRiskFactorCard | RiskFactorCard | 별도 컴포넌트 |
| **상중하 UI** | ✅ 작은 칩 (h-8, grid-cols-[40px,1fr]) | ❌ 큰 카드 (flex-1, py-3) | **수시만 컴팩트** |
| **빈도강도 UI** | ✅ 개선 전/후 2열 그리드 | ❌ 지원 안 함 | - |
| **Empty State** | ✅ 큰 CTA 카드 ("위험요인 없음" 강조) | ❌ 작은 버튼만 | **수시만 UX 개선** |

### 4.2 대분류/소분류 관리

| 항목 | 수시 | 최초/정기 | 차이점 |
|------|------|-----------|--------|
| **중복 선택 금지** | ✅ excludedIds로 차단 | ❌ 없음 | **수시만 중복 방지** |
| **컴포넌트** | OccasionalCategoryItem | CategoryItem | 별도 컴포넌트 |
| **조치 정보 입력** | ✅ 소분류별 (actionDate, assignee, confirmer) | ❌ 없음 | - |

### 4.3 검증

| 항목 | 수시 | 최초/정기 | 차이점 |
|------|------|-----------|--------|
| **검증 함수** | ✅ validateOccasionalAssessment<br>✅ validateBasicInfo, validateOccasionalInfo, validateRiskMethod, validateWorkCategory | ❌ 없음 (폼 내부 간단 체크?) | **수시만 체계적 검증** |
| **방식별 검증** | ✅ validateLevel, validateFrequencyIntensity | ❌ 없음 | - |
| **개선 효과 검증** | ✅ afterRiskScore > beforeRiskScore 체크 | ❌ 없음 | - |

---

## 5. 공통화 전략

### 5.1 공통 Base 타입

```typescript
// 공통 Base
interface RiskFactorBase {
  id: string;
  factor: string;
  improvement: string;
  workPeriodStart: string;
  workPeriodEnd: string;
}

interface SubcategoryBase {
  id: number;
  name: string;
  isCustom?: boolean;
  riskFactors: RiskFactor[];  // Union 타입
}

interface CategoryBase {
  id: string;
  categoryId: number | null;
  categoryName: string;
  subcategories: Subcategory[];  // Union 타입
}
```

### 5.2 개별 확장

```typescript
// 수시 확장
interface OccasionalSubcategory extends SubcategoryBase {
  actionDate: string;
  actionAssigneeIds: string[];
  actionConfirmerIds: string[];
  reviewComments?: string[];
}

interface OccasionalAssessmentPayload {
  // 기본
  siteName: string;
  companyName: string;
  teamId: string;
  // ...
  // 수시 전용
  triggerReason: string;
  triggerDate: string;
  riskMethod: 'LEVEL' | 'FREQUENCY_INTENSITY';
  categories: OccasionalCategory[];
}

// 최초/정기 확장
interface InitialAssessmentPayload {
  // 기본
  siteName: string;
  companyName: string;
  // ...
  // 최초/정기 전용 (있다면)
  assessmentYear?: string;  // 정기만?
  categories: Category[];  // level만 있는 RiskFactor
}
```

### 5.3 공통 컴포넌트 추출

| 컴포넌트 | 공통화 방안 |
|----------|-------------|
| **BasicInfoSection** | 이미 공통 사용 중 ✅ |
| **CategorySearchInput** | 공통 |
| **SubcategoryCheckList** | 공통 (excludedIds 옵션) |
| **RiskFactorCard** | **조건부 렌더링**으로 통합 가능 (`riskMethod` prop) |
| **ActionAssigneeSelectModal** | 공통 (수시만 사용) |
| **WorkflowSection** | 공통 (최초/정기도 도입 시) |

---

## 6. 주요 Gap 요약

### ✅ 수시에만 있는 기능 (이관 필요)

1. **단계별 워크플로우** (useWorkflow, WorkflowSection, WorkflowProgress)
2. **중복 선택 금지** (excludedIds 기반)
3. **빈도강도 방식** (beforeFrequency/afterFrequency)
4. **위험요인 컴팩트 UI** (작은 칩, Empty State)
5. **체계적 검증** (방식별, 개선 효과)
6. **소분류별 조치 정보** (actionDate, assignee, confirmer)
7. **수시 평가 정보** (triggerReason, triggerDate)

### ⚠️ 최초/정기 특화 (확인 필요)

1. **teamId 없음** (all 고정?)
2. **상중하 방식 고정** (riskMethod 선택 불가)
3. **단일 화면 폼** (워크플로우 없음)

### 🔧 이관 시 의사결정 필요

1. **위험성 방식 선택 제공?**
   - 옵션 A: 최초/정기도 LEVEL/FREQUENCY_INTENSITY 선택 가능
   - 옵션 B: 상중하 고정 유지 (간단함)
   - **권장**: 옵션 A (데이터 일관성)

2. **단계별 워크플로우 도입?**
   - 옵션 A: 수시와 동일하게 아코디언 순차 작성
   - 옵션 B: 단일 화면 유지 (현재)
   - **권장**: 옵션 A (UX 통일)

3. **소분류별 조치 정보?**
   - 옵션 A: 최초/정기도 도입 (관리 강화)
   - 옵션 B: 수시만 유지
   - **권장**: 옵션 A (데이터 일관성)

4. **공통 타입 구조**
   - 옵션 A: Base + 개별 확장
   - 옵션 B: 완전 공통 (discriminated union)
   - **권장**: 옵션 A (유연성)

---

## 7. 다음 단계 (Phase 1)

1. **의사결정 확정** (위 4개 항목)
2. **공통 Base 타입 설계**
3. **workflow reducer 공통 추출**
4. **duplicate guard 유틸 공통 추출**
5. **검증 함수 인터페이스 설계**

---

**작성자**: Claude Code
**검토 필요**: PO, FE Lead
