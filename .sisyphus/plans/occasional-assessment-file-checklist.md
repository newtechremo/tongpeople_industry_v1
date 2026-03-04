# 수시 위험성평가 구현 파일 단위 작업표

> 작성일: 2026-02-19
> 기준 문서: `.sisyphus/plans/occasional-assessment-implementation.md` (v3.0)
> 목적: Phase 0~5를 실제 파일 수정 순서로 분해한 실행 체크리스트

---

## 1. 실행 순서

1. Phase 0 타입 통일
2. Phase 1 데이터 모델/검증
3. Phase 2 컴포넌트 구현
4. Phase 3 폼 연결
5. Phase 4 상세보기 반영
6. Phase 5 회귀 테스트/문서화

---

## 2. 파일별 체크리스트

## Phase 0. 타입 통일 (1h)

- [x] `apps/admin-web/src/pages/RiskAssessmentPage.tsx`
  - `ADHOC` 표기 제거, `OCCASIONAL` 기준으로 통일
  - `TYPE_FROM_DRAFT`에서 레거시 `ADHOC -> OCCASIONAL` 정규화 유지
  - 완료 기준: 목록/임시저장 진입 경로 정상

- [x] `apps/admin-web/src/pages/risk-assessment/CreateAssessmentPage.tsx`
  - create 타입 매핑을 `OCCASIONAL`로 통일
  - 기존 `adhoc` URL 케이스가 있다면 호환 리다이렉트 또는 정규화 처리
  - 완료 기준: `/safety/risk/create/occasional` 정상 진입

- [x] `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`
  - TYPE_LABELS/분기에서 `OCCASIONAL` 기준 반영
  - 레거시 데이터 렌더 호환 유지
  - 완료 기준: 수시 상세 진입 시 라벨/분기 오류 없음

- [x] `apps/admin-web/src/mocks/risk-assessment.ts`
  - mock type/dataset 생성값을 `OCCASIONAL` 중심으로 정리
  - 레거시 샘플이 필요하면 명시적으로 주석 처리
  - 완료 기준: 수시 mock 생성/조회 일관성 확보

## Phase 1. 데이터 모델/검증 (2h)

- [x] `apps/admin-web/src/mocks/users.ts` (신규)
  - 조치자/조치확인자 선택용 Mock 사용자 20명 이상
  - 검색 키(이름/부서/직책) 포함
  - 완료 기준: 모달 검색 테스트 가능

- [x] `apps/admin-web/src/components/risk-assessment/forms/AdHocAssessmentForm.tsx`
  - `OccasionalAssessmentForm.tsx`로 대체/신규 구현
  - `riskMethod`, 공통 조치 필드 상태 추가
  - 완료 기준: 컴파일 에러 없이 상태 구조 반영

- [x] `apps/admin-web/src/components/risk-assessment/validation/occasional.ts` (신규)
  - `validateOccasionalAssessment`
  - `validateRiskFactorByMethod`
  - `calculateGradeLevel`
  - 완료 기준: 방식별 검증 함수 분리 완료

## Phase 2. 컴포넌트 구현 (3h)

- [x] `apps/admin-web/src/pages/risk-assessment/components/RiskMethodSelector.tsx` (신규)
  - `LEVEL` / `FREQUENCY_INTENSITY` 라디오 선택 UI
  - 완료 기준: 폼 상태와 양방향 연동

- [x] `apps/admin-web/src/pages/risk-assessment/modals/ActionAssigneeSelectModal.tsx` (신규)
  - 사용자 검색 + 다중선택 + 선택 요약
  - 조치자/조치확인자 공용 사용 가능 구조
  - 완료 기준: 선택값 배열 반환 동작 확인

- [x] `apps/admin-web/src/components/risk-assessment/forms/fieldsets/RiskItemsFieldset.tsx`
  - `riskMethod` 분기 렌더
  - 공통 조치 필드(조치일/조치자/조치확인자) 추가
  - 완료 기준: 두 방식에서 공통 필드 노출 및 입력 가능

- [x] `apps/admin-web/src/components/risk-assessment/forms/fieldsets/OccasionalCategoryGroupFieldset.tsx` (신규)
  - 수시도 `Category -> Subcategory -> RiskFactor` 3단계 강제
  - 기존 재사용 컴포넌트 조합(`CategoryItem`, `SubcategoryCheckList`, `RiskItemsFieldset`)
  - 완료 기준: 단일 fieldset 한계를 제거하고 3단계 구조 유지

## Phase 3. 폼 연결 (4h)

- [x] `apps/admin-web/src/components/risk-assessment/forms/OccasionalAssessmentForm_Workflow.tsx` (신규)
  - 5단계 순차 워크플로우로 구현 (기본정보 → 수시발생정보 → 위험성 방식 → 작업공종 → 결재라인)
  - fieldset 조립 + submit 검증 연결
  - 완료 기준: 수시 만들기 end-to-end 제출 성공

- [x] `apps/admin-web/src/components/risk-assessment/forms/AdHocAssessmentForm.tsx`
  - `OccasionalAssessmentForm.tsx` (레거시 폼 방식)으로 대체. 신규 진입은 Workflow 버전 사용
  - 완료 기준: 신규 진입 경로에서 Workflow 버전 사용

- [x] `apps/admin-web/src/pages/risk-assessment/CreateAssessmentPage.tsx`
  - `OccasionalAssessmentForm_Workflow` import/렌더 연결
  - `InitialAssessmentForm_Workflow` 연결 (최초/정기 이관 동시 완료)
  - 완료 기준: occasional 타입에서 정확한 폼 표시

## Phase 4. 상세보기 반영 (2h)

- [x] `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`
  - 수시 전용 필드(`triggerReason`, `triggerDate`) 표시
  - 방식별 위험성 표시 분기 (LEVEL: 상중하 배지, FREQUENCY_INTENSITY: 개선 전/후 2열 그리드)
  - 공통 조치 필드 표시 (조치일, 조치자, 조치확인자)
  - 개선 효과 섹션 추가 (점수 변화, 등급 변화, 개선됨/주의 필요 배지)
  - 완료 기준: LEVEL/FREQUENCY_INTENSITY 모두 표시 정확

## Phase 5. 회귀 테스트/정리 (2h)

- [x] `apps/admin-web/src/mocks/risk-assessment.ts`
  - 수시 샘플 2종(LEVEL/FREQUENCY_INTENSITY) 확정

- [x] `.sisyphus/plans/occasional-assessment-implementation.md`
  - 실제 구현 결과 반영 (2026-02-23 업데이트)

- [ ] `docs/risk-assessment/수시_위험성평가_구현_완료.md` (신규 권장)
  - 최종 동작/검증 결과 문서화 — 미착수 (선택 항목)

---

## 3. 검증 커맨드

- [x] `rg "ADHOC" apps/admin-web/src/pages apps/admin-web/src/components apps/admin-web/src/mocks` — 호환 어댑터/주석 외 0건 확인
- [x] `pnpm -C apps/admin-web typecheck` 또는 `tsc --noEmit` — 위험성평가 관련 에러 0건 (pre-existing 에러는 다른 팀 담당)
- [ ] `pnpm -C apps/admin-web lint` — 미실행

검증 원칙:
- `ADHOC`는 호환 어댑터/주석 외 신규 생성 경로에서 금지
- 수시는 반드시 `OCCASIONAL`로 생성/저장/표시

---

## 4. 커밋 분할 권장

1. `refactor: OCCASIONAL 타입 통일 및 레거시 ADHOC 정규화`
2. `feat: 수시 위험성 방식 선택 및 공통 조치 필드 데이터 모델 추가`
3. `feat: RiskMethodSelector 및 ActionAssigneeSelectModal 구현`
4. `feat: 수시 3단계 카테고리 그룹 필드셋 및 폼 연결`
5. `feat: 수시 상세보기 방식별/공통 조치 필드 반영`
6. `test/docs: 회귀 점검 및 구현 문서 정리`
