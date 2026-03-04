# 결재라인 컴포넌트화 작업 로그

**작업일**: 2026-01-23
**이슈**: #12 - 위험성평가 최초 만들기 수정 및 결재라인 수정
**브랜치**: `feature/12-risk-assessment-approval-line`
**작업자**: Claude + 사용자

---

## 📋 작업 개요

결재라인 테이블을 재사용 가능한 컴포넌트로 분리하고, 팀(업체) 태그 기능을 추가했습니다.

---

## ✅ 완료된 작업

### 1. 프로젝트 설정
- [x] develop 브랜치 최신 버전 pull
- [x] 이슈 #12 생성: https://github.com/newtechremo/tongpeople_industry_v1/issues/12
- [x] 브랜치 생성: `feature/12-risk-assessment-approval-line`
- [x] Worktree 생성: `C:\hongtong\tongpeople_industry_v1-worktrees\feature-12-risk-assessment-approval-line`

### 2. 팀(업체) 태그 기능 추가

#### 2.1 타입 정의 업데이트
**파일**: `packages/shared/src/types/approval.ts`

```typescript
export interface ApprovalLine {
  id: string;
  name: string;
  tags: ApprovalDocumentType[];
  teamId?: number | null;  // 추가: 팀(업체) ID (null이면 공용)
  isPinned: boolean;
  approvers: Approver[];
  createdAt: string;
}
```

#### 2.2 결재라인 설정 UI 업데이트
**파일**: `apps/admin-web/src/components/settings/ApprovalLineSettings.tsx`

- ✅ 소속 팀(업체) 선택 드롭다운 추가
- ✅ 테이블에 "소속 팀" 컬럼 추가
- ✅ Mock 팀 데이터 추가

```typescript
const MOCK_TEAMS = [
  { id: 1, name: '(주)정이앤지' },
  { id: 2, name: '협력업체A' },
  { id: 3, name: '협력업체B' },
  { id: 4, name: '자체팀' },
];
```

#### 2.3 결재라인 필터링 로직
**파일**: `apps/admin-web/src/components/risk-assessment/forms/InitialAssessmentForm.tsx`

```typescript
const availableApprovalLines = useMemo(() => {
  return approvalLines.filter((line) => {
    // 태그 필터링
    const hasRequiredTag = line.tags.includes('RISK_ASSESSMENT') || line.tags.includes('GENERAL');
    if (!hasRequiredTag) return false;

    // 팀 필터링: 공용 또는 현재 사용자의 팀과 일치
    const isPublic = !line.teamId;
    const isMyTeam = currentUserTeamId !== null && line.teamId === currentUserTeamId;

    return isPublic || isMyTeam;
  });
}, [approvalLines, currentUserTeamId]);
```

#### 2.4 결재라인 선택 모달 UI
**파일**: `apps/admin-web/src/pages/risk-assessment/modals/ApprovalLineSelectModal.tsx`

- ✅ 팀 배지 표시 (파란색: 팀 전용, 회색: 공용)

#### 2.5 Mock 데이터 업데이트
**파일**: `apps/admin-web/src/mocks/approval-lines.ts`

```typescript
// 공용 결재라인
{ id: '1', name: '현장 기본 결재라인', teamId: null, ... }

// 팀 전용 결재라인
{ id: '3', name: '정이앤지 위험성평가', teamId: 1, ... }
{ id: '4', name: '협력업체A 간편결재', teamId: 2, ... }
```

### 3. 결재라인 컴포넌트화

#### 3.1 ApprovalLineDisplay 컴포넌트 생성
**파일**: `apps/admin-web/src/components/approval/ApprovalLineDisplay.tsx` (새 파일)

**주요 기능**:
- 2가지 모드: `preview` (생성 시, 서명란 없음), `document` (상세 시, 서명란 있음)
- 결재 직책 헤더 행
- 이름 행 (이름만 표시 - 간결한 디자인)
- 서명 행 (document 모드만)
- 서명 이미지 에러 처리
- 빈 결재라인 처리

```typescript
interface ApprovalLineDisplayProps {
  mode: 'preview' | 'document';
  approvers: Approver[];
  signatures?: Record<string, string>;
  onApplySignature?: (userId: string) => void;
  canEdit?: boolean;
}
```

**컴포넌트 구조**:
```
ApprovalLineDisplay
├── ApproverHeaderRow (결재 직책)
├── ApproverNameRow (이름만)
├── ApproverSignatureRow (서명란, document 모드만)
│   └── SignatureDisplay (서명 이미지 + 에러 처리)
└── EmptyState (결재자 없음)
```

#### 3.2 BasicInfoSection 리팩토링
**파일**: `apps/admin-web/src/pages/risk-assessment/components/BasicInfoSection.tsx`

**변경 전** (101-171줄, 70줄):
```tsx
{approvalLineApprovers.length > 0 && (
  <div className="border border-gray-200 rounded-lg overflow-x-auto">
    <table className="min-w-max w-full text-sm">
      {/* ... 긴 테이블 코드 ... */}
    </table>
  </div>
)}
```

**변경 후** (7줄):
```tsx
<ApprovalLineDisplay
  mode={canEdit ? 'document' : 'preview'}
  approvers={approvalLineApprovers}
  signatures={signatures}
  onApplySignature={onApplySignature}
  canEdit={canEdit}
/>
```

#### 3.3 디자인 사양

**테이블 구조** (작은 테이블 - ApprovalLineSettings 스타일):
```
┌─────────────────────────────────────┐
│ Header (bg-gray-50)                 │
│ 공무직원 │ 현장관리자 │  보건      │  ← approvalTitle
├─────────────────────────────────────┤
│ 최서연   │ 이영희     │ 한수진     │  ← userName (이름만!)
├─────────────────────────────────────┤
│ Signature Row (document 모드만)     │
│ [서명img]│ 서명 필요  │ [서명img]  │
│          │ [불러오기] │            │
└─────────────────────────────────────┘
```

**주의**: `position` (조직 내 직급) 표시 안 함 - 간결한 디자인 유지

---

## 📁 생성/수정된 파일

### 생성된 파일
```
apps/admin-web/src/components/approval/
└── ApprovalLineDisplay.tsx  (200줄)
```

### 수정된 파일
```
packages/shared/src/types/approval.ts
apps/admin-web/src/components/settings/ApprovalLineSettings.tsx
apps/admin-web/src/components/risk-assessment/forms/InitialAssessmentForm.tsx
apps/admin-web/src/pages/risk-assessment/modals/ApprovalLineSelectModal.tsx
apps/admin-web/src/pages/risk-assessment/components/BasicInfoSection.tsx
apps/admin-web/src/mocks/approval-lines.ts
```

---

## 🚧 현재 상태

### 작업 완료
- [x] 팀(업체) 태그 기능 구현
- [x] ApprovalLineDisplay 컴포넌트 생성
- [x] BasicInfoSection 리팩토링
- [x] TypeScript 타입 체크 (컴포넌트 관련 에러 없음)
- [x] Shared 패키지 빌드 성공

### 미해결 이슈
- [ ] **브라우저 반영 안 됨**: Worktree에서 작업한 내용이 브라우저에 표시되지 않음
- [ ] **Worktree 제거 실패**: 권한 오류로 worktree 제거 불가

---

## 🔧 다음 작업 (재시작 후)

### 1. Worktree 문제 해결

**VSCode 창 닫기**:
- worktree 폴더를 열고 있는 VSCode 창 종료
- 탐색기에서 해당 폴더 닫기

**Worktree 제거**:
```bash
cd C:\hongtong\tongpeople_industry_v1
git worktree remove C:\hongtong\tongpeople_industry_v1-worktrees\feature-12-risk-assessment-approval-line --force
```

또는

```bash
git worktree prune
```

### 2. 원본 저장소에서 작업

```bash
# 1. 브랜치 전환
cd C:\hongtong\tongpeople_industry_v1
git checkout feature/12-risk-assessment-approval-line

# 2. worktree에서 작업한 내용 복사 (필요 시)
# ApprovalLineDisplay.tsx 파일이 있는지 확인

# 3. 개발 서버 실행
pnpm dev:admin

# 4. 브라우저 확인
# http://localhost:5173/safety/risk/create/initial
```

### 3. 브라우저 테스트

#### 위험성평가 생성 (preview 모드)
- [ ] 결재라인 테이블 표시 (작은 테이블)
- [ ] 이름만 표시 (직급 없음)
- [ ] 서명란 없음
- [ ] "결재라인 변경" 버튼 동작

#### 위험성평가 상세 (document 모드)
- [ ] 결재라인 테이블 표시 (작은 테이블)
- [ ] 이름만 표시 (직급 없음)
- [ ] 서명란 있음
- [ ] "서명 불러오기" 버튼 표시

### 4. 커밋

```bash
git add .
git commit -m "feat: 결재라인 팀 태그 및 컴포넌트화

- 결재라인에 teamId 필드 추가 (공용/팀 전용 구분)
- ApprovalLineDisplay 컴포넌트 생성 (preview/document 모드)
- BasicInfoSection 리팩토링 (70줄 → 7줄)
- 결재라인 선택 모달에 팀 배지 표시
- 결재라인 필터링 로직에 팀 태그 반영
- 이름만 표시하는 간결한 디자인 적용
- 서명 이미지 에러 처리 추가

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 📝 중요 참고사항

### ApprovalLineDisplay 컴포넌트 위치
```
apps/admin-web/src/components/approval/ApprovalLineDisplay.tsx
```

### 디자인 원칙
1. **작은 테이블 구조**: ApprovalLineSettings의 ApproverPreviewTable과 동일한 스타일
2. **이름만 표시**: position (조직 내 직급) 표시 안 함
3. **2가지 모드**:
   - `preview`: 서명란 없음 (문서 생성 시)
   - `document`: 서명란 있음 (문서 상세 시)

### 전자서명 데이터 구조
- **출처**: Worker 테이블의 `signatureUrl` 필드
- **형식**: `data:image/png;base64,...`
- **표시**: `<img>` 태그로 렌더링 (높이: 40px)
- **에러 처리**: 이미지 로딩 실패 시 텍스트로 fallback

---

## 🔍 트러블슈팅

### 문제: Worktree에서 작업한 내용이 브라우저에 반영 안 됨

**원인**:
- 2개의 워크트리 사용으로 인한 혼란
- HMR이 제대로 작동하지 않음
- 브라우저 캐시 문제 가능성

**해결책**:
1. Worktree 제거하고 원본 저장소에서 작업
2. 브라우저 강제 새로고침 (Ctrl + Shift + R)
3. 개발 서버 재시작

### 문제: Worktree 제거 시 권한 오류

**원인**:
- VSCode나 탐색기에서 폴더를 열고 있음
- 개발 서버가 실행 중

**해결책**:
1. VSCode 창 모두 닫기
2. 탐색기에서 폴더 닫기
3. 개발 서버 종료
4. 다시 제거 시도

---

## 📚 관련 문서

- [구현 계획](../.sisyphus/plans/approval-line-component-refactor.md)
- [화면 명세서](../risk-assessment/pc/screen-specs/initial-create.md)

---

**작업 중단 시점**: 2026-01-23 오후 2:50
**재개 시 할 일**: Worktree 제거 → 원본 저장소 전환 → 브라우저 테스트
