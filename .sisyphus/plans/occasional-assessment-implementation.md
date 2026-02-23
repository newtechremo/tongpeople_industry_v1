# 수시 위험성평가 구현 계획 (업그레이드)

> Version: 3.1
> 작성일: 2026-02-19
> 목적: 수시 평가를 최초/정기와 구조적으로 통일하면서, 위험성 산정 방식을 `상중하` 또는 `빈도강도`로 선택 가능하게 확장

---

## 구현 완료 요약 (2026-02-23 기준)

**Phase 0~4 완료. Phase 5 체크리스트 완료 (완료 문서는 미작성).**

### 실제 구현 시 설계 변경 사항

1. **`RiskFactorFrequencyIntensity` 구조 변경**
   - 계획: 단일 평가 `frequency / intensity / riskScore / gradeLevel`
   - 실제: 개선 전/후 이중 구조로 확장
     - `beforeFrequency / beforeIntensity / beforeRiskScore / beforeGradeLevel`
     - `afterFrequency / afterIntensity / afterRiskScore / afterGradeLevel`
   - 이유: 개선대책 적용 전후의 위험성 변화를 상세보기에서 시각적으로 비교 표시하기 위함

2. **워크플로우 방식 채택**
   - 계획: 기존 폼 방식 유지 + 컴포넌트 교체
   - 실제: `OccasionalAssessmentForm_Workflow.tsx` (5단계 순차 워크플로우)로 구현
   - 단계: 기본정보 → 수시발생정보 → 위험성 방식 선택 → 작업 공종 → 결재라인

3. **최초/정기 이관 동시 완료 (브랜치 핵심 목표)**
   - `InitialAssessmentForm_Workflow.tsx` 신규 구현 (2단계: 기본정보 → 작업공종)
   - `CreateAssessmentPage.tsx`에서 INITIAL/REGULAR 라우팅 연결 완료
   - 수시와 동일한 `OccasionalCategoryItem` 컴포넌트 재사용 (`showActionFields={false}`)

### 미착수 항목

- `occasional-detail-confirmation-plan.md` - 확인자 리스트 기능 (별도 계획 문서 존재, 다음 스프린트)

---

## 1. 요약

이 계획은 다음 3가지를 동시에 달성한다.

1. 수시 평가 타입 표기를 `OCCASIONAL`로 통일한다.
2. 수시 만들기/상세에서 위험성 방식(`LEVEL` | `FREQUENCY_INTENSITY`)을 지원한다.
3. 두 방식 모두 공통 조치 필드(조치일, 조치자, 조치확인자)를 필수로 적용한다.

핵심 원칙은 기존 최초/정기의 3단계 구조를 유지하는 것이다.

`Category -> Subcategory -> RiskFactor`

---

## 2. 배경 및 정렬 포인트

- 최초/정기는 이미 3단계 중첩 구조와 검증 흐름이 안정화되어 있다.
- 수시는 기존 `AdHocAssessmentForm.tsx`가 있으나 구조/타입/UI 일관성이 부족하다.
- 기존 계획의 충돌 지점(타입 통일 vs 레거시 호환, 구조 재사용 vs 구조 일치)을 이번 버전에서 명확히 분리한다.

정리:
- 제품 내부 표준 명칭: `OCCASIONAL`
- 레거시 입력 호환(읽기): `ADHOC` 허용
- 신규 저장/출력(쓰기): `OCCASIONAL`만 허용

---

## 3. 목표 (Definition Targets)

1. 수시 만들기에서 위험성 방식 선택 UI 제공
2. 수시 위험요인 카드에 공통 조치 필드 필수화
3. 방식별 위험성 입력 UI를 카드 내부 분기 영역으로 한정
4. 상세보기에서 방식별 표시 정확성 보장
5. 최초/정기 회귀 0건 유지

---

## 4. 범위

### 4.1 포함

- 타입 통일: `ADHOC -> OCCASIONAL`
- 수시 폼 리팩터링
- 수시 상세보기 반영
- Mock 사용자(조치자/조치확인자 선택용) 추가
- 방식별 검증 함수 추가
- 기존 draft/목록 데이터 레거시 호환 처리

### 4.2 제외

- 상시(CONTINUOUS) 기능 구현
- 실 DB 스키마 마이그레이션
- 실 사용자/권한 API 연동
- PDF/엑셀 산출물 개편

---

## 5. 데이터 모델 설계

## 5.1 타입

```ts
type AssessmentType = 'INITIAL' | 'REGULAR' | 'OCCASIONAL' | 'CONTINUOUS';
type LegacyAssessmentType = 'ADHOC';

type RiskMethod = 'LEVEL' | 'FREQUENCY_INTENSITY';
type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
type RiskGradeLevel = 'LOW' | 'MEDIUM' | 'HIGH';
```

## 5.2 수시 Payload

```ts
interface OccasionalAssessmentPayload {
  siteName: string;
  companyName: string;
  teamId: string;
  approvalLineId: string | null;
  workPeriodStart: string;
  workPeriodEnd: string;

  triggerReason: string;
  triggerDate: string;
  riskMethod: RiskMethod;

  categories: Category[];
}
```

## 5.3 RiskFactor 확장

```ts
interface RiskFactorBase {
  id: string;
  factor: string;
  improvement: string;
  workPeriodStart: string;
  workPeriodEnd: string;

  actionDate: string;
  actionAssigneeIds: string[];
  actionConfirmerIds: string[];
}

interface RiskFactorLevel extends RiskFactorBase {
  level: RiskLevel | null;
}

interface RiskFactorFrequencyIntensity extends RiskFactorBase {
  frequency: number | null;   // 1-4
  intensity: number | null;   // 1-5
  riskScore: number | null;   // frequency * intensity
  gradeLevel: RiskGradeLevel | null;
}

type RiskFactor = RiskFactorLevel | RiskFactorFrequencyIntensity;
```

## 5.4 레거시 호환 규칙

- 저장/출력 시 `ADHOC` 생성 금지
- 로드/파싱 시 `ADHOC`를 `OCCASIONAL`로 정규화
- `TYPE_FROM_DRAFT`는 호환 어댑터로 유지

---

## 6. UI/컴포넌트 설계

## 6.1 구조 원칙

- 수시도 최초/정기와 동일한 3단계 렌더 트리 유지
- 분기는 RiskFactor 카드의 위험성 입력 영역만 담당
- 공통 조치 필드는 분기와 무관하게 항상 노출

## 6.2 컴포넌트 구성

```text
OccasionalAssessmentForm
├─ BasicInfoFieldset
├─ TriggerReasonFieldset
├─ RiskMethodSelector                 (신규)
├─ OccasionalCategoryGroupFieldset    (신규, 3단계 컨테이너)
│  ├─ CategoryItem                    (재사용)
│  ├─ SubcategoryCheckList            (재사용)
│  └─ RiskItemsFieldset               (수정)
│     ├─ 공통: 위험요인/개선대책/작업기간
│     ├─ 공통: 조치일/조치자/조치확인자
│     └─ 분기: LEVEL 또는 FREQUENCY_INTENSITY
└─ ActionAssigneeSelectModal          (신규)
```

## 6.3 핵심 수정 대상

- `RiskMethodSelector.tsx` 신규
- `ActionAssigneeSelectModal.tsx` 신규
- `RiskItemsFieldset.tsx` 수정
  - `riskMethod` props 추가
  - 공통 조치 필드 추가
  - 방식별 입력 분기
- `OccasionalCategoryGroupFieldset.tsx` 신규
  - 수시에서도 Category/Subcategory/RiskFactor 3단계를 강제

주의:
- `CategoryFieldset` 단일 category/subcategory 패턴만으로는 목표 구조를 충족하지 못한다.
- 따라서 수시 전용 그룹 fieldset(컨테이너)을 두고, 내부에 기존 재사용 컴포넌트를 조합한다.

---

## 7. 검증 설계

## 7.1 공통 검증

- categories 1개 이상
- category별 subcategory 1개 이상
- subcategory별 riskFactors 1개 이상
- factor/improvement 필수
- actionDate 필수
- actionAssigneeIds 최소 1인
- actionConfirmerIds 최소 1인

## 7.2 방식별 검증

- `LEVEL`: `level` 필수
- `FREQUENCY_INTENSITY`:
  - frequency 1~4
  - intensity 1~5
  - riskScore 일치
  - gradeLevel 계산값 일치

## 7.3 빈도강도 등급 정책 (확정)

- 정책 확정일: 2026-02-19
- 계산식: `riskScore = frequency * intensity`
- 입력 범위:
  - `frequency`: 1~4
  - `intensity`: 1~5

등급 경계값(고정):

| 점수 범위 | 등급값(`gradeLevel`) | 화면 표시 |
|---|---|---|
| 1~5 | `LOW` | 하 |
| 6~14 | `MEDIUM` | 중 |
| 15~20 | `HIGH` | 상 |

```ts
export function calculateGradeLevel(score: number): RiskGradeLevel {
  if (score >= 15) return 'HIGH';
  if (score >= 6) return 'MEDIUM';
  return 'LOW';
}
```

검증 규칙:
- `gradeLevel === calculateGradeLevel(riskScore)` 이어야 한다.
- 점수와 등급은 클라이언트에서 자동 계산/고정하며 수동 입력을 허용하지 않는다.

## 7.4 전환 정책

- riskMethod 변경 시 비활성 방식의 필드만 초기화
- 공통 필드(조치일/조치자/조치확인자)는 유지
- 사용자 확인 모달을 통해 전환 시 데이터 손실 안내

---

## 8. Phase 계획

## Phase 0: 타입 통일 (1h)

목표:
- 제품 표준 타입을 `OCCASIONAL`로 통일
- 레거시 `ADHOC`는 읽기 호환만 유지

작업:
1. 전역 타입/매핑 교체
2. `RiskAssessmentDetailPage` 포함 타입 라벨 정리
3. `TYPE_FROM_DRAFT`에 레거시 파서(`ADHOC -> OCCASIONAL`) 유지
4. 저장/생성 코드에서 `ADHOC` 생산 경로 제거

완료 기준:
- 신규 데이터 생성 시 `ADHOC` 0건
- 레거시 draft/목록 로드 정상
- 코드 검색 기준:
  - 일반 로직에서 `ADHOC` 직접 사용 0건
  - 예외: 호환 어댑터/주석에 한정

## Phase 1: 데이터 모델 (2h)

작업:
1. Mock 사용자 20명 구성(`mocks/users.ts`)
2. 수시 payload/risk factor 타입 확장
3. 검증 함수 작성
   - `validateOccasionalAssessment`
   - `validateRiskFactorByMethod`
   - `calculateGradeLevel`

완료 기준:
- 타입 에러 없음
- 검증 함수 단위 케이스 작성

## Phase 2: 컴포넌트 (3h)

작업:
1. `RiskMethodSelector` 신규
2. `ActionAssigneeSelectModal` 신규
3. `RiskItemsFieldset` 수정
4. `OccasionalCategoryGroupFieldset` 신규 (핵심)

완료 기준:
- 폼 컴포넌트 단위 렌더 확인
- 공통 조치 필드 정상 동작
- 방식 분기 렌더 정상

## Phase 3: 폼 연결 (4h)

작업:
1. `OccasionalAssessmentForm` 리팩터링
   - 주의: 파일 rename은 Phase 0에서 완료된 전제로 진행
2. 기존 fieldset + 신규 컴포넌트 조립
3. `CreateAssessmentPage` 라우팅/연결
4. submit 시 검증/저장 연결

완료 기준:
- 수시 만들기 end-to-end 동작
- 두 방식 모두 제출 성공
- 검증 에러 메시지 정상

## Phase 4: 상세보기 (2h)

작업:
1. `RiskAssessmentDetailPage` 수시 표시 확장
2. 방식별 위험성 영역 분기
3. 공통 조치 필드 표시

완료 기준:
- LEVEL/FREQUENCY_INTENSITY 모두 정확한 표시
- triggerReason/triggerDate 노출

## Phase 5: 회귀 테스트 (2h)

작업:
1. 최초/정기/수시(2방식) 시나리오 점검
2. 타입 매핑/레거시 로드 점검
3. 문서/체크리스트 업데이트

완료 기준:
- 회귀 이슈 0건
- 릴리즈 체크리스트 충족

---

## 9. 테스트 체크리스트

- 수시 만들기 진입/렌더
- riskMethod 전환 동작
- LEVEL 입력/검증/제출
- FREQUENCY_INTENSITY 입력/검증/제출
- 공통 조치 필드 필수 검증(양 방식 동일)
- 상세보기 방식별 노출 정확성
- 최초/정기 회귀
- legacy ADHOC draft 로드 호환

---

## 10. DoD (최종)

- `OCCASIONAL` 기준 생성/저장/표시 일관성 확보
- 수시 3단계 구조(Category -> Subcategory -> RiskFactor) 구현 완료
- 공통 조치 필드가 양 방식 모두에서 필수 적용
- 방식별 검증/표시 정확성 확보
- 레거시 `ADHOC`는 읽기 호환만 유지, 신규 생성 경로 제거
- 빈도강도 등급 경계값(1~5/6~14/15~20) 고정 반영
- `tsc --noEmit`, lint, 핵심 수동 시나리오 통과

---

## 11. 리스크와 대응

1. 구조 통일 중 기존 수시 화면과 충돌
- 대응: 신규 컨테이너(`OccasionalCategoryGroupFieldset`)로 격리 후 점진 이관

2. 타입 통일 시 레거시 draft 유실
- 대응: 정규화 함수로 `ADHOC -> OCCASIONAL` 흡수

3. riskMethod 전환 시 사용자 데이터 손실 혼란
- 대응: 전환 경고 + 공통 필드 유지 정책 적용

---

## 12. 참고 파일

- `apps/admin-web/src/components/risk-assessment/forms/InitialAssessmentForm.tsx`
- `apps/admin-web/src/components/risk-assessment/forms/AdHocAssessmentForm.tsx`
- `apps/admin-web/src/components/risk-assessment/forms/fieldsets/RiskItemsFieldset.tsx`
- `apps/admin-web/src/pages/risk-assessment/CreateAssessmentPage.tsx`
- `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`
