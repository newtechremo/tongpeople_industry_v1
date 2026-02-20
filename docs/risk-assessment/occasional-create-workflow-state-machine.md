# 수시 위험성평가 만들기: 워크플로우 상태 전이표 (Phase 0)

## 1) 목적
- `OccasionalAssessmentForm`를 아코디언 순차 확장 + 섹션 잠금 구조로 전환할 때 기준이 되는 상태 전이 규칙을 정의한다.
- 섹션 잠금/해제, 완료/오류, 선행값 변경 시 후행 무효화(invalidation) 정책을 일관되게 유지한다.

## 2) 섹션 정의
1. `BASIC_INFO` (기본 정보)
2. `OCCASIONAL_INFO` (수시 평가 정보)
3. `RISK_METHOD` (위험성 산정 방식)
4. `WORK_CATEGORY` (작업 공종)

## 3) 섹션 상태
- `locked`: 이전 섹션 미완료로 진입 불가
- `active`: 현재 작성 대상
- `completed`: 섹션 유효성 충족 완료
- `error`: 필수값 누락/유효성 불일치 존재

## 4) 공통 이벤트
- `INIT_FORM`
- `EDIT_FIELD(section, field)`
- `CLICK_SECTION(section)`
- `CLICK_NEXT(section)`
- `CLICK_PREV(section)`
- `SUBMIT_ATTEMPT`
- `RISK_METHOD_CHANGED`
- `AUTO_VALIDATE(section)`

## 5) 섹션별 완료 조건(Guard)

### `BASIC_INFO` 완료 조건
- `teamId` 유효
- `workPeriodStart`/`workPeriodEnd` 유효
- 결재라인이 필수 정책이면 `approvalLineId` 존재

### `OCCASIONAL_INFO` 완료 조건
- `includeTriggerInfo = false` 이면 완료
- `includeTriggerInfo = true` 이면 `triggerDate` + `triggerReason` 모두 유효

### `RISK_METHOD` 완료 조건
- `riskMethod in ['LEVEL', 'FREQUENCY_INTENSITY']`

### `WORK_CATEGORY` 완료 조건
- 카테고리 1개 이상
- 각 카테고리에 소분류 1개 이상
- 각 소분류에 위험요인 1개 이상
- 각 소분류의 공통 조치 필드(`actionDate`, `actionAssigneeIds`, `actionConfirmerIds`) 유효
- 선택한 `riskMethod` 기준 위험요인 입력 필드 유효

## 6) 초기 상태 (INIT_FORM)

| Section | Initial State | 설명 |
|---|---|---|
| `BASIC_INFO` | `active` | 첫 진입 섹션 |
| `OCCASIONAL_INFO` | `locked` | `BASIC_INFO` 완료 후 해제 |
| `RISK_METHOD` | `locked` | `OCCASIONAL_INFO` 완료 후 해제 |
| `WORK_CATEGORY` | `locked` | `RISK_METHOD` 완료 후 해제 |

## 7) 전이 규칙

### 7.1 `CLICK_NEXT(section)`

| 현재 섹션 | Guard 통과 | 현재 섹션 상태 | 다음 섹션 상태 | 부가 동작 |
|---|---|---|---|---|
| `BASIC_INFO` | false | `error` | 변경 없음 | 에러 포커스 |
| `BASIC_INFO` | true | `completed` | `active`(`OCCASIONAL_INFO`) | 다음 섹션 자동 확장/조건부 스크롤 |
| `OCCASIONAL_INFO` | false | `error` | 변경 없음 | 에러 포커스 |
| `OCCASIONAL_INFO` | true | `completed` | `active`(`RISK_METHOD`) | 자동 확장 |
| `RISK_METHOD` | false | `error` | 변경 없음 | 에러 포커스 |
| `RISK_METHOD` | true | `completed` | `active`(`WORK_CATEGORY`) | 자동 확장 |
| `WORK_CATEGORY` | false | `error` | 변경 없음 | 에러 포커스 |
| `WORK_CATEGORY` | true | `completed` | 변화 없음 | 제출 가능 상태 |

### 7.2 `CLICK_SECTION(section)`

| 대상 섹션 상태 | 동작 |
|---|---|
| `locked` | 이동 차단, 잠금 안내 표시 |
| `active` | 유지 |
| `completed` | 펼침 허용(수정 모드 진입) |
| `error` | 즉시 해당 섹션으로 이동 |

### 7.3 `EDIT_FIELD(section, field)`

| 조건 | 상태 전이 |
|---|---|
| `completed` 섹션 값 수정 시작 | 해당 섹션을 `active`로 변경 |
| 수정 후 자동검증 실패 | 해당 섹션 `error` |
| 수정 후 자동검증 성공 | 해당 섹션 `completed` |

### 7.4 `SUBMIT_ATTEMPT`

| 조건 | 동작 |
|---|---|
| 4개 섹션 모두 `completed` | submit 실행 |
| 미완료/오류 섹션 존재 | 첫 실패 섹션으로 이동 + `error` 표시 |

## 8) 무효화(invalidation) 규칙

| 변경 이벤트 | 영향 섹션 | 무효화 규칙 |
|---|---|---|
| `BASIC_INFO.workPeriodStart/end` 변경 | `WORK_CATEGORY` | 위험요인의 `workPeriodStart/end` 재검증. 정책에 따라 자동 동기화 또는 `error` 전환 |
| `OCCASIONAL_INFO.includeTriggerInfo` false 전환 | `OCCASIONAL_INFO` | `triggerReason/triggerDate` 입력값 유지 가능. 검증에서는 제외 |
| `RISK_METHOD_CHANGED` | `WORK_CATEGORY` | 방식 불일치 위험요인(`level` vs `frequency/intensity`)을 무효화. 공통 필드는 유지 |
| 카테고리/소분류 삭제 | `WORK_CATEGORY` | 삭제된 하위 데이터 참조 정리 후 재검증 |
| 결재라인 필수 정책 변경 | `BASIC_INFO` | `approvalLineId` 재검증 |

## 9) 자동 확장/자동 스크롤 정책
- 기본: `CLICK_NEXT` 성공 시 다음 섹션 자동 확장.
- 자동 스크롤 금지 조건:
  - 사용자가 이미 다른 섹션을 수동 편집 중
  - 최근 1초 내 수동 스크롤 발생
  - 모바일 키보드 활성 상태
- 접근성: 자동 이동 시 섹션 제목에 포커스 이동.

## 10) 키보드 정책
- `Enter = 다음 단계`는 기본 비활성.
- 활성 조건:
  - 단일 입력 컨트롤 포커스 상태
  - `textarea`, IME 조합 중 상태에서는 비활성
- 권장: `Ctrl+Enter` 또는 버튼 기반 진행을 기본값으로 유지.

## 11) 구현 권장 구조
- 상태 저장: `useReducer`로 섹션 상태 전이 중앙 관리
- 검증:
  - 섹션 단위 검증 함수 (`validateBasicInfo`, `validateOccasionalInfo`, `validateRiskMethod`, `validateWorkCategory`)
  - 제출 시 전체 검증 + 첫 실패 섹션 포커싱
- UI:
  - 섹션 헤더: `state badge (locked/active/completed/error)`
  - 섹션 푸터: `이전/다음` CTA
  - 상단 진행률: `completedSections / 4`

## 12) 이벤트 로그(권장)
- `workflow_section_completed`
- `workflow_section_reopened`
- `workflow_invalidation_triggered`
- `workflow_submit_blocked`

이벤트 로그는 자동확장/스크롤 피로도와 무효화 정책의 실제 사용자 영향 분석에 사용한다.
