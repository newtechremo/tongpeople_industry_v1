# 위험성평가 테이블 정리 및 UI 개선

**작업일**: 2026-01-26
**브랜치**: feature/12-risk-assessment-approval-line
**작업자**: Claude Code

## 작업 개요

위험성평가 목록 테이블과 상세보기 화면의 UI를 정리하여 사용자 혼란을 제거하고 명확한 정보 구조를 제공합니다.

## 주요 변경사항

### 1. 목록 테이블 "결재사항" 컬럼 제거

**파일**: `apps/admin-web/src/pages/RiskAssessmentPage.tsx`

#### 문제점
"결재사항" 컬럼이 서로 다른 성격의 데이터를 혼재:
- **결재라인 서명 상태** (정적 데이터, 문서 승인)
- **근로자 문서 확인 현황** (동적 데이터, 매일 변화)
- **평가 유형별 의미 차이**:
  - 최초/정기: 작업기간 중 1회 확인
  - 수시/상시: 매일 TBM 진행 여부

#### 해결 방안
- 목록 테이블에서 "결재사항" 컬럼 **완전 제거**
- Phase 2에서 타입별 특화 기능 개발 시 재설계
- 근로자 확인 기능은 상세보기 내 별도 탭으로 구현 예정

#### 변경 내용

**테이블 헤더** (7개 → 6개 컬럼)
```tsx
// 변경 전
<th>소속</th>
<th>작업기간</th>
<th>작업공종(대분류)</th>
<th>작성자</th>
<th>구분</th>
<th>결재상태</th>
<th>결재사항</th>  // ← 제거

// 변경 후
<th>소속</th>
<th>작업기간</th>
<th>작업공종(대분류)</th>
<th>작성자</th>
<th>구분</th>
<th>결재상태</th>
```

**테이블 바디**
```tsx
// 제거된 셀
<td className="px-4 py-4 text-base text-slate-600">
  {assessment.workerCount}명 결재
  {assessment.unconfirmedCount && assessment.unconfirmedCount > 0 && (
    <span className="text-red-600 font-medium ml-2">
      (미확인 {assessment.unconfirmedCount}명)
    </span>
  )}
</td>
```

#### 유지된 데이터
- `workerCount`, `unconfirmedCount` 필드는 interface와 Mock 데이터에 유지
- Phase 2에서 근로자 확인 기능 구현 시 재사용 예정

---

### 2. 상세보기 문서번호 제거

**파일**: `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`

#### 변경 이유
- 시스템 내부 ID가 사용자에게 노출됨
- 사용자에게 불필요한 정보

#### 변경 내용

**상세보기 헤더**
```tsx
// 변경 전
<div>
  <h1 className="text-2xl font-black tracking-tight text-slate-800">위험성평가 상세</h1>
  <p className="text-base text-slate-500 mt-1">문서 번호: {documentId}</p>
</div>

// 변경 후
<div>
  <h1 className="text-2xl font-black tracking-tight text-slate-800">위험성평가 상세</h1>
</div>
```

#### 유지된 로직
- `documentId` 변수 및 관련 로직은 **모두 유지**
- 서버 API 호출, 라우팅, localStorage 키 등에 계속 사용
- UI에만 표시하지 않음

---

### 3. DRAFT 상태 제거 (이전 작업)

**파일**: `apps/admin-web/src/pages/risk-assessment/CreateAssessmentPage.tsx`

#### 변경 내용
```tsx
// 변경 전
status: 'DRAFT',  // 작성중 상태, localStorage 전용

// 변경 후
status: 'PENDING',  // 바로 결재대기 상태로 생성
```

#### 변경 사유
- DRAFT 개념이 명확히 정의되지 않음
- 만들기 후 바로 확인 및 수정 가능하도록 개선
- 임시 저장 대신 즉시 서버 전송 방식 채택

---

### 4. 접근 제한 및 오류 메시지 개선 (이전 작업)

**파일**: `apps/admin-web/src/pages/RiskAssessmentPage.tsx`

#### 클릭 이벤트 로직
```tsx
onClick={() => {
  // 최초 위험성평가는 모두 열람 가능
  if (assessment.type === 'INITIAL') {
    navigate(`/safety/risk/${assessment.id}`);
    return;
  }

  // 수시/정기/상시는 개발중
  alert('해당 유형의 위험성평가는 현재 개발중입니다.\n최초 위험성평가만 상세보기가 가능합니다.');
}}
```

#### 개선 사항
- DRAFT 상태 체크 제거
- 최초 평가는 작업기간 상태와 무관하게 모두 열람 가능
- 명확한 오류 메시지 제공

---

## 최종 UI 구조

### 목록 테이블
```
┌─────┬──────────┬──────────────┬────────┬────────────┬──────────┐
│ 소속 │ 작업기간 │ 작업공종(대분류) │ 작성자 │    구분    │ 결재상태 │
├─────┼──────────┼──────────────┼────────┼────────────┼──────────┤
│ 전체 │ 26-01-20 │   전체 공종   │ 김안전 │ 작업기간 중 │ 결재완료 │
│      │  ~       │              │        │            │          │
│      │ 26-02-20 │              │        │            │          │
└─────┴──────────┴──────────────┴────────┴────────────┴──────────┘
```

### 상세보기 헤더
```
← [뒤로가기]
위험성평가 상세

[목록] [수정] [삭제]
```

---

## 데이터 구조 유지 사항

### RiskAssessment Interface
```typescript
interface RiskAssessment {
  id: string;
  type: AssessmentType;
  title: string;
  status: AssessmentStatus;
  workPeriodStart: string;
  workPeriodEnd: string;
  workCategory: string;
  author: string;
  teamId?: string;
  createdAt: string;
  workerCount?: number;        // 유지 (Phase 2 재사용)
  unconfirmedCount?: number;   // 유지 (Phase 2 재사용)
}
```

### Mock 데이터
- 모든 평가 항목에 `workerCount`, `unconfirmedCount` 값 유지
- 추후 근로자 확인 기능 구현 시 즉시 활용 가능

---

## 향후 계획 (Phase 2)

### 근로자 문서 확인 기능
- **위치**: 상세보기 내 별도 탭
- **최초/정기**: 작업기간 중 확인한 근로자 명단 관리
- **수시/상시**: TBM 진행 여부 및 참석자 관리

### TBM (Tool Box Meeting) 기능
- 상시 위험성평가와 연동
- 매일 진행 여부 체크
- TBM 문서 생성 및 이력 관리

### 데이터 활용
- 현재 유지 중인 `workerCount`, `unconfirmedCount` 필드 사용
- 백엔드 API 연동 시 즉시 활용

---

## 기술적 고려사항

### 타입 안전성
- TypeScript interface에서 선택적 필드(`?`)로 정의
- 하위 호환성 유지

### 컴포넌트 최적화
- 불필요한 렌더링 제거
- 테이블 컬럼 수 감소로 성능 개선

### 확장성
- 데이터 구조는 유지하면서 UI만 변경
- Phase 2 개발 시 최소한의 수정으로 기능 추가 가능

---

## 테스트 확인사항

### UI 검증
- [x] 목록 테이블 6개 컬럼 표시
- [x] 테이블 레이아웃 깔끔하게 정렬
- [x] 상세보기에서 문서번호 미표시
- [x] 상세보기 헤더 "위험성평가 상세"만 표시

### 기능 검증
- [x] 목록에서 최초 평가 클릭 시 정상 이동
- [x] 상세보기 페이지 로딩 정상
- [x] 상세보기 모든 데이터 정상 표시
- [x] 수시/정기/상시 클릭 시 "개발중" alert 표시

### 데이터 검증
- [x] Mock 데이터 구조 변경 없음
- [x] workerCount, unconfirmedCount 필드 유지
- [x] documentId 변수 및 로직 유지
- [x] localStorage 저장 로직 정상

---

## 커밋 범위

### 수정된 파일
1. `apps/admin-web/src/pages/RiskAssessmentPage.tsx`
   - 테이블 헤더: "결재사항" 컬럼 제거
   - 테이블 바디: 결재사항 셀 제거
   - 접근 제한 로직 개선
   - DRAFT 상태 제거

2. `apps/admin-web/src/pages/risk-assessment/CreateAssessmentPage.tsx`
   - DRAFT → PENDING 상태로 변경
   - 생성 ID 접두사: draft → doc

3. `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`
   - 문서번호 표시 제거

### 새로 생성된 파일
- `.sisyphus/plans/risk-assessment-table-cleanup.md` (작업 계획서)

---

**작업 완료**: 2026-01-26
**다음 단계**: develop 브랜치로 PR 생성
