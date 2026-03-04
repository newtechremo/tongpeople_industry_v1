# 수시 위험성평가 워크플로우 구현 가이드

## 개요

수시 위험성평가 폼을 자유 입력 방식에서 순차적 워크플로우 방식으로 전환하여 사용자 경험을 개선했습니다.

## 구현된 기능

### 1. 워크플로우 상태 관리 (`useWorkflow.ts`)
- **섹션 상태**: locked, active, completed, error
- **4개 섹션**: BASIC_INFO, OCCASIONAL_INFO, RISK_METHOD, WORK_CATEGORY
- **상태 전이 로직**: 상태 전이 문서(`occasional-create-workflow-state-machine.md`) 기반 구현
- **무효화 규칙**: RISK_METHOD 변경 시 WORK_CATEGORY 재검증

### 2. 섹션별 검증 (`workflowValidation.ts`)
- `validateBasicInfo`: 팀, 작업기간, 결재라인 검증
- `validateOccasionalInfo`: 수시 평가 정보 조건부 검증
- `validateRiskMethod`: 산정 방식 선택 검증
- `validateWorkCategory`: 카테고리, 소분류, 위험요인, 조치 필드 전체 검증

### 3. 워크플로우 UI 컴포넌트

#### WorkflowSection (`WorkflowSection.tsx`)
- 아코디언 섹션 컴포넌트
- 상태별 시각적 피드백 (locked/active/completed/error)
- 자동 확장/축소 애니메이션
- 이전/다음 버튼

#### WorkflowProgress (`WorkflowProgress.tsx`)
- 진행률 표시 (완료된 섹션 / 전체 섹션)
- 진행률 바
- 상태 메시지

### 4. 자동 스크롤 (`useAutoScroll.ts`)
- 다음 섹션 자동 스크롤
- 수동 스크롤 감지 (1초 내 수동 스크롤 시 자동 스크롤 차단)
- 접근성: 섹션 제목에 포커스 이동

### 5. 무효화 규칙 유틸리티 (`invalidation.ts`)
- 작업기간 변경 시 위험요인 동기화
- 위험성 산정 방식 변경 시 위험요인 필드 초기화
- 삭제 시 하위 데이터 정리

## 파일 구조

```
apps/admin-web/src/components/risk-assessment/
├── hooks/
│   ├── useWorkflow.ts              # 워크플로우 상태 관리
│   └── useAutoScroll.ts            # 자동 스크롤
├── validation/
│   └── workflowValidation.ts      # 섹션별 검증
├── utils/
│   └── invalidation.ts             # 무효화 규칙
└── forms/
    ├── components/
    │   ├── WorkflowSection.tsx     # 아코디언 섹션
    │   └── WorkflowProgress.tsx    # 진행률 표시
    ├── OccasionalAssessmentForm.tsx          # 기존 폼 (자유 입력)
    └── OccasionalAssessmentForm_Workflow.tsx # 새 폼 (워크플로우)
```

## 통합 방법

### Option 1: 기존 폼 교체 (권장)

```bash
# 백업
mv OccasionalAssessmentForm.tsx OccasionalAssessmentForm_Old.tsx

# 워크플로우 버전을 기본으로 설정
mv OccasionalAssessmentForm_Workflow.tsx OccasionalAssessmentForm.tsx
```

### Option 2: 조건부 사용

```tsx
import OccasionalAssessmentForm from '@/components/risk-assessment/forms/OccasionalAssessmentForm';
import OccasionalAssessmentFormWorkflow from '@/components/risk-assessment/forms/OccasionalAssessmentForm_Workflow';

// 기능 플래그 기반 선택
const useWorkflow = true; // 또는 환경 변수에서 가져오기

function CreatePage() {
  const FormComponent = useWorkflow
    ? OccasionalAssessmentFormWorkflow
    : OccasionalAssessmentForm;

  return <FormComponent onSubmit={handleSubmit} onCancel={handleCancel} />;
}
```

## 테스트 체크리스트

### 기본 흐름
- [ ] 1. 기본 정보 섹션이 처음에 active 상태로 표시됨
- [ ] 2. 나머지 섹션들이 locked 상태로 표시됨
- [ ] 3. 기본 정보 입력 후 "다음" 클릭 → 수시 평가 정보 섹션 활성화
- [ ] 4. 수시 평가 정보 입력 후 "다음" → 위험성 산정 방식 섹션 활성화
- [ ] 5. 위험성 산정 방식 선택 후 "다음" → 작업 공종 섹션 활성화
- [ ] 6. 모든 섹션 완료 시 "만들기" 버튼 활성화

### 검증
- [ ] 필수 필드 누락 시 error 상태로 전환
- [ ] 에러 메시지 표시
- [ ] 완료된 섹션은 completed 상태로 표시 (녹색 체크)

### 재편집
- [ ] completed 섹션 클릭 시 재편집 가능 (active로 전환)
- [ ] 재편집 시 해당 섹션이 active로 변경
- [ ] 재검증 후 다시 completed로 전환 가능

### 무효화 규칙
- [ ] 작업 시작일/종료일 변경 시:
  - 모든 위험요인의 작업기간 자동 동기화 확인
  - WORK_CATEGORY 섹션이 active로 변경 확인
- [ ] 위험성 산정 방식 변경 시:
  - 확인 대화상자 표시
  - 기존 위험요인 평가 데이터 초기화 확인
  - WORK_CATEGORY 섹션이 active로 변경 확인

### 자동 스크롤
- [ ] "다음" 버튼 클릭 시 다음 섹션으로 스크롤
- [ ] 포커스가 다음 섹션 헤더로 이동
- [ ] 수동 스크롤 1초 내에는 자동 스크롤 차단

### 진행률
- [ ] 상단에 진행률 표시 (X / 4)
- [ ] 진행률 바가 시각적으로 업데이트
- [ ] 완료 시 "모든 섹션 완료!" 메시지 표시

### 접근성
- [ ] 키보드로 섹션 간 이동 가능
- [ ] locked 섹션은 tabindex=-1
- [ ] 자동 스크롤 시 포커스 이동

### 에지 케이스
- [ ] 중간 섹션으로 바로 이동 시도 시 차단 (locked)
- [ ] 빈 카테고리로 "다음" 시도 시 에러 표시
- [ ] 위험성 산정 방식 변경 취소 시 이전 방식 유지

## UX 개선 사항

### Before (자유 입력)
- 사용자가 어디서부터 작성해야 할지 불명확
- 필수 입력 누락 시 제출 시점에만 알 수 있음
- 전체 폼이 한번에 보여 압도적

### After (워크플로우)
- 순차적 안내로 명확한 작성 흐름
- 각 단계별 즉시 검증
- 한 번에 하나의 섹션에 집중
- 진행률 표시로 동기 부여
- 자동 스크롤로 편의성 향상

## 향후 개선 가능 영역

1. **로컬 스토리지 자동 저장**
   - 작성 중 데이터 손실 방지
   - 브라우저 종료 후 복구 가능

2. **키보드 단축키**
   - Ctrl+Enter: 다음 단계
   - Ctrl+Shift+Enter: 이전 단계

3. **자동 완성**
   - 이전 평가 기록 기반 자동 완성 제안

4. **실시간 동기화 (다중 사용자)**
   - WebSocket 기반 협업 편집

5. **모바일 최적화**
   - 모바일 키보드 감지
   - 터치 제스처 지원

## 문의 및 피드백

워크플로우 관련 이슈나 개선 제안은 GitHub Issues에 등록해주세요.
