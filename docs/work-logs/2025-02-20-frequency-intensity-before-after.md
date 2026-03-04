# 빈도강도 방식 개선 전/후 평가 구현

## 작업 일자
2025-02-20

## 작업 내용
빈도강도(FREQUENCY_INTENSITY) 방식에서 위험성 평가를 두 번(개선 전/개선 후) 수행하도록 개선

## 참조 자료
- 화면 캡처: `docs/화면 캡처 2026-02-20 115907.png`
- 구현 방식: Option 1 (수직 레이아웃, 한 화면에 두 평가 표시)

## 변경 사항

### 1. 타입 정의 수정
**파일**: `apps/admin-web/src/components/risk-assessment/types/occasional.ts`

**변경 전**:
```typescript
export interface RiskFactorFrequencyIntensity extends RiskFactorBase {
  frequency: number | null;
  intensity: number | null;
  riskScore: number | null;
  gradeLevel: RiskGradeLevel | null;
}
```

**변경 후**:
```typescript
export interface RiskFactorFrequencyIntensity extends RiskFactorBase {
  // 개선 전 평가
  beforeFrequency: number | null;   // 1-4
  beforeIntensity: number | null;   // 1-5
  beforeRiskScore: number | null;   // beforeFrequency * beforeIntensity
  beforeGradeLevel: RiskGradeLevel | null;

  // 개선 후 평가
  afterFrequency: number | null;    // 1-4
  afterIntensity: number | null;    // 1-5
  afterRiskScore: number | null;    // afterFrequency * afterIntensity
  afterGradeLevel: RiskGradeLevel | null;
}
```

**타입 가드 수정**:
```typescript
// 변경 전
export function isRiskFactorFrequencyIntensity(factor: OccasionalRiskFactor): factor is RiskFactorFrequencyIntensity {
  return 'frequency' in factor && 'intensity' in factor;
}

// 변경 후
export function isRiskFactorFrequencyIntensity(factor: OccasionalRiskFactor): factor is RiskFactorFrequencyIntensity {
  return 'beforeFrequency' in factor && 'beforeIntensity' in factor;
}
```

### 2. 검증 로직 수정
**파일**: `apps/admin-web/src/components/risk-assessment/validation/occasional.ts`

**함수**: `validateFrequencyIntensity`

**주요 변경**:
- 단일 평가 → 개선 전/후 두 번 평가로 확장
- 각 평가에 대해 빈도(1~4), 강도(1~5), 점수, 등급 검증
- 에러 메시지에 `[개선 전]`, `[개선 후]` 접두사 추가

**검증 내용**:
```typescript
// 개선 전 평가
- beforeFrequency: 1~4 필수
- beforeIntensity: 1~5 필수
- beforeRiskScore: beforeFrequency * beforeIntensity 검증
- beforeGradeLevel: calculateGradeLevel(beforeRiskScore) 검증

// 개선 후 평가
- afterFrequency: 1~4 필수
- afterIntensity: 1~5 필수
- afterRiskScore: afterFrequency * afterIntensity 검증
- afterGradeLevel: calculateGradeLevel(afterRiskScore) 검증
```

### 3. UI 컴포넌트 수정
**파일**: `apps/admin-web/src/components/risk-assessment/forms/components/OccasionalRiskFactorCard.tsx`

**주요 변경**:

#### 업데이트 함수 분리
```typescript
// 개선 전 평가 업데이트
const updateBeforeEvaluation = (
  beforeFrequency: number | null,
  beforeIntensity: number | null
) => {
  const beforeRiskScore = beforeFrequency !== null && beforeIntensity !== null
    ? beforeFrequency * beforeIntensity
    : null;
  const beforeGradeLevel = beforeRiskScore !== null
    ? calculateGradeLevel(beforeRiskScore)
    : null;

  onChange({ ...factor, beforeFrequency, beforeIntensity, beforeRiskScore, beforeGradeLevel });
};

// 개선 후 평가 업데이트
const updateAfterEvaluation = (
  afterFrequency: number | null,
  afterIntensity: number | null
) => {
  const afterRiskScore = afterFrequency !== null && afterIntensity !== null
    ? afterFrequency * afterIntensity
    : null;
  const afterGradeLevel = afterRiskScore !== null
    ? calculateGradeLevel(afterRiskScore)
    : null;

  onChange({ ...factor, afterFrequency, afterIntensity, afterRiskScore, afterGradeLevel });
};
```

#### UI 레이아웃 (수직 배치)
```tsx
<div className="space-y-6">
  {/* 개선 전 평가 */}
  <div className="space-y-3">
    <h6 className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
      위험성 수준 (개선 전)
    </h6>
    {/* 빈도 선택 (1~4, 파란색 테마) */}
    {/* 강도 선택 (1~5, 파란색 테마) */}
    {/* 점수 + 등급 표시 (파란색 테두리) */}
  </div>

  {/* 구분선 */}
  <div className="border-t border-dashed border-slate-300" />

  {/* 개선 후 평가 */}
  <div className="space-y-3">
    <h6 className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
      개선 후 등급 (개선 후)
    </h6>
    {/* 빈도 선택 (1~4, 초록색 테마) */}
    {/* 강도 선택 (1~5, 초록색 테마) */}
    {/* 점수 + 등급 표시 (초록색 테두리) */}
  </div>
</div>
```

**색상 구분**:
- 개선 전: 파란색 테마 (`blue-500`, `blue-50`, `blue-700`)
- 개선 후: 초록색 테마 (`green-500`, `green-50`, `green-700`)

### 4. 폼 초기화 수정
**파일**: `apps/admin-web/src/components/risk-assessment/forms/OccasionalAssessmentForm_Workflow.tsx`

**라인**: 447-455

**변경 후**:
```typescript
return riskMethod === 'LEVEL'
  ? ({ ...baseFactor, level: null } as RiskFactorLevel)
  : ({
      ...baseFactor,
      beforeFrequency: null,
      beforeIntensity: null,
      beforeRiskScore: null,
      beforeGradeLevel: null,
      afterFrequency: null,
      afterIntensity: null,
      afterRiskScore: null,
      afterGradeLevel: null,
    } as RiskFactorFrequencyIntensity);
```

### 5. 무효화 유틸리티 수정
**파일**: `apps/admin-web/src/components/risk-assessment/utils/invalidation.ts`

**함수**: `resetRiskFactorsForMethodChange`

**변경 후**:
```typescript
} else {
  return {
    ...baseFactor,
    beforeFrequency: null,
    beforeIntensity: null,
    beforeRiskScore: null,
    beforeGradeLevel: null,
    afterFrequency: null,
    afterIntensity: null,
    afterRiskScore: null,
    afterGradeLevel: null,
  };
}
```

## 등급 계산 로직 (변경 없음)
```typescript
function calculateGradeLevel(score: number): RiskGradeLevel {
  if (score >= 15) return 'HIGH';
  if (score >= 6) return 'MEDIUM';
  return 'LOW';
}
```

**등급 경계값**:
- LOW: 1~5점
- MEDIUM: 6~14점
- HIGH: 15~20점

## 테스트 체크리스트
- [ ] 위험요인 추가 시 before/after 필드가 모두 null로 초기화되는지 확인
- [ ] 개선 전 빈도/강도 선택 시 점수와 등급이 자동 계산되는지 확인
- [ ] 개선 후 빈도/강도 선택 시 점수와 등급이 자동 계산되는지 확인
- [ ] 점수 15 이상 = HIGH, 6~14 = MEDIUM, 1~5 = LOW 확인
- [ ] 개선 전/후 각각 누락 시 검증 에러 메시지 표시 확인
- [ ] 상중하 방식과 빈도강도 방식 간 전환 시 필드 초기화 확인
- [ ] 개선 전/후 색상 구분 (파란색/초록색) 표시 확인

## 추가 개선 사항 (v1.1)

### 6. UI 레이아웃 개선
**파일**: `apps/admin-web/src/components/risk-assessment/forms/components/OccasionalRiskFactorCard.tsx`

**변경 사항**:
- 수직 레이아웃 → **2열 그리드 레이아웃** (md: 이상에서)
- 개선 전/후를 좌우 배치로 한눈에 비교 가능
- 헤더에 점수/등급 미리보기 추가
- 라벨 간소화 (빈도/강도만 표시)

### 7. 개선 효과 시각화
**파일**: `apps/admin-web/src/components/risk-assessment/forms/components/OccasionalRiskFactorCard.tsx`

**추가 기능**:
```tsx
// 개선 전/후 모두 입력된 경우 하단에 표시
<개선 효과 표시>
  - 점수 변화: 15 → 6 (-9)
  - 등급 변화: 상 → 중
  - 개선 상태 배지: "개선됨" (초록색) / "주의 필요" (주황색)
```

**조건부 표시**:
- 점수 감소: 초록색 배지 "개선됨" ✓
- 점수 증가: 주황색 배지 "주의 필요" ⚠️
- 점수 동일: 배지 없음

### 8. 검증 강화 - 개선 효과 검증
**파일**: `apps/admin-web/src/components/risk-assessment/validation/occasional.ts`

**추가 검증**:
```typescript
if (factor.afterRiskScore > factor.beforeRiskScore) {
  errors.push(
    `[개선 효과] 개선 후 점수가 개선 전보다 높습니다. 개선대책을 재검토해주세요.`
  );
}
```

**검증 시점**:
- 개선 전/후 평가가 모두 완료된 경우에만
- 제출 시 최종 검증에서 차단

## 완료 기준
- ✅ 타입 정의 수정 완료
- ✅ 검증 로직 수정 완료
- ✅ UI 컴포넌트 수정 완료
- ✅ 폼 초기화 수정 완료
- ✅ 무효화 유틸리티 수정 완료
- ✅ 2열 그리드 레이아웃 적용 (v1.1)
- ✅ 개선 효과 시각화 추가 (v1.1)
- ✅ 개선 효과 검증 강화 (v1.1)
- ⏳ 수동 테스트 필요
- ⏳ 상세보기 페이지에도 개선 전/후 표시 추가 필요
- ⏳ 기존 데이터 마이그레이션 검토 필요 (있는 경우)

## 다음 단계
1. 개발 서버에서 수동 테스트 수행
2. 빈도강도 방식으로 위험요인 생성 후 개선 전/후 평가 입력 테스트
3. 검증 에러 메시지 확인
4. 상세보기 페이지에서도 개선 전/후 평가 표시 확인 필요
