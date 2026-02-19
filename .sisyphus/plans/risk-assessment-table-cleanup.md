# 위험성평가 테이블 정리 작업 계획

**작성일**: 2026-01-26
**계획자**: Prometheus
**우선순위**: Medium
**예상 난이도**: Low

---

## 📋 작업 개요

위험성평가 목록 테이블과 상세보기 화면의 UI를 정리합니다.

### 배경
- **문제점 1**: 목록 테이블의 "결재사항" 컬럼이 서로 다른 성격의 데이터 혼재
  - 결재라인 서명 상태 (정적 데이터)
  - 근로자 문서 확인 현황 (동적 데이터)
  - 평가 유형별로 확인 의미가 다름 (최초: 기간 중 1회, 상시: 매일 TBM)

- **문제점 2**: 상세보기에 문서번호가 사용자에게 노출
  - 시스템 내부 ID가 화면에 표시됨
  - 사용자에게 불필요한 정보

### 해결 방향
1. 목록 테이블에서 "결재사항" 컬럼 완전 제거
2. 상세보기에서 문서번호 UI 제거 (서버 저장 로직은 유지)
3. 추후 Phase 2에서 타입별 특화 기능 개발 시 재설계

---

## 🎯 작업 목표

### 1차 목표
- [x] 목록 테이블 "결재사항" 컬럼 제거
- [x] 상세보기 "문서 번호" 표시 제거
- [x] 코드 정리 (불필요한 필드는 유지, 나중에 재사용)

### 제외 사항
- Mock 데이터의 `workerCount`, `unconfirmedCount` 필드는 **유지**
- 추후 근로자 확인 기능 구현 시 재사용 예정

---

## 📁 영향받는 파일

### 주요 수정 파일
1. `apps/admin-web/src/pages/RiskAssessmentPage.tsx`
   - 테이블 헤더: "결재사항" 컬럼 제거
   - 테이블 바디: 결재사항 셀 제거
   - 컬럼 수: 7개 → 6개

2. `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`
   - 318번 줄: `<p className="text-base text-slate-500 mt-1">문서 번호: {documentId}</p>` 제거

### 유지되는 데이터 구조
- `RiskAssessment` interface의 `workerCount`, `unconfirmedCount` 필드
- Mock 데이터의 해당 값들
- documentId 변수 및 로직 (서버 통신용)

---

## 🔧 구현 상세

### Task 1: 목록 테이블 헤더 수정

**파일**: `apps/admin-web/src/pages/RiskAssessmentPage.tsx`

**위치**: 테이블 `<thead>` 섹션

**변경 전**:
```tsx
<thead className="bg-gray-50 border-b border-gray-200">
  <tr>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">소속</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">작업기간</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">작업공종(대분류)</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">작성자</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">구분</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">결재상태</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">결재사항</th>
  </tr>
</thead>
```

**변경 후**:
```tsx
<thead className="bg-gray-50 border-b border-gray-200">
  <tr>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">소속</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">작업기간</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">작업공종(대분류)</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">작성자</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">구분</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-slate-500 uppercase">결재상태</th>
  </tr>
</thead>
```

**작업**: 마지막 `<th>` (결재사항) 제거

---

### Task 2: 목록 테이블 바디 수정

**파일**: `apps/admin-web/src/pages/RiskAssessmentPage.tsx`

**위치**: 테이블 `<tbody>` 섹션, `filteredAssessments.map()` 내부

**변경 전**:
```tsx
<tr ...>
  {/* 소속 */}
  <td className="px-4 py-4 text-base text-slate-600">{teamName}</td>

  {/* 작업기간 */}
  <td className="px-4 py-4 text-base text-slate-600">
    {assessment.workPeriodStart.slice(2)} ~ {assessment.workPeriodEnd.slice(2)}
  </td>

  {/* 작업공종(대분류) */}
  <td className="px-4 py-4 text-base text-slate-700 font-medium">
    {assessment.workCategory}
  </td>

  {/* 작성자 */}
  <td className="px-4 py-4 text-base text-slate-600">{assessment.author}</td>

  {/* 구분 (작업기간 상태) */}
  <td className="px-4 py-4">
    <span className={`px-2 py-1 text-sm font-medium rounded ...`}>
      {workPeriodStatus}
    </span>
  </td>

  {/* 결재상태 */}
  <td className="px-4 py-4">
    <span className={`px-2 py-1 text-sm font-medium rounded ${approvalStatus.color}`}>
      {approvalStatus.label}
    </span>
  </td>

  {/* 결재사항 */}
  <td className="px-4 py-4 text-base text-slate-600">
    {assessment.workerCount}명 결재
    {assessment.unconfirmedCount && assessment.unconfirmedCount > 0 && (
      <span className="text-red-600 font-medium ml-2">
        (미확인 {assessment.unconfirmedCount}명)
      </span>
    )}
  </td>
</tr>
```

**변경 후**:
```tsx
<tr ...>
  {/* 소속 */}
  <td className="px-4 py-4 text-base text-slate-600">{teamName}</td>

  {/* 작업기간 */}
  <td className="px-4 py-4 text-base text-slate-600">
    {assessment.workPeriodStart.slice(2)} ~ {assessment.workPeriodEnd.slice(2)}
  </td>

  {/* 작업공종(대분류) */}
  <td className="px-4 py-4 text-base text-slate-700 font-medium">
    {assessment.workCategory}
  </td>

  {/* 작성자 */}
  <td className="px-4 py-4 text-base text-slate-600">{assessment.author}</td>

  {/* 구분 (작업기간 상태) */}
  <td className="px-4 py-4">
    <span className={`px-2 py-1 text-sm font-medium rounded ...`}>
      {workPeriodStatus}
    </span>
  </td>

  {/* 결재상태 */}
  <td className="px-4 py-4">
    <span className={`px-2 py-1 text-sm font-medium rounded ${approvalStatus.color}`}>
      {approvalStatus.label}
    </span>
  </td>
</tr>
```

**작업**: 마지막 `<td>` (결재사항) 블록 전체 제거

---

### Task 3: 상세보기 문서번호 제거

**파일**: `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`

**위치**: 318번 줄, 페이지 헤더 부분

**변경 전**:
```tsx
<div>
  <h1 className="text-2xl font-black tracking-tight text-slate-800">위험성평가 상세</h1>
  <p className="text-base text-slate-500 mt-1">문서 번호: {documentId}</p>
</div>
```

**변경 후**:
```tsx
<div>
  <h1 className="text-2xl font-black tracking-tight text-slate-800">위험성평가 상세</h1>
</div>
```

**작업**: `<p>` 태그 한 줄 제거

**중요**: `documentId` 변수와 관련 로직은 **삭제하지 않음**
- 서버 API 호출 시 필요
- 내부 데이터 추적용
- UI에만 표시하지 않음

---

## ✅ 검증 항목

### UI 검증
- [ ] 목록 테이블이 6개 컬럼으로 표시됨
- [ ] 테이블 레이아웃이 깔끔하게 정렬됨
- [ ] 상세보기에서 "문서 번호: ..." 텍스트가 사라짐
- [ ] 상세보기 헤더가 "위험성평가 상세"만 표시됨

### 기능 검증
- [ ] 목록에서 최초 평가 클릭 시 정상 이동
- [ ] 상세보기 페이지 로딩 정상
- [ ] 상세보기에서 모든 데이터 정상 표시
- [ ] 수시/정기/상시 클릭 시 "개발중" alert 정상

### 데이터 검증
- [ ] Mock 데이터 구조 변경 없음
- [ ] workerCount, unconfirmedCount 필드 유지
- [ ] documentId 변수 및 로직 유지
- [ ] localStorage 저장 로직 정상

---

## 📝 구현 순서

1. **RiskAssessmentPage.tsx 수정** (목록 테이블)
   - 테이블 헤더 수정 (Task 1)
   - 테이블 바디 수정 (Task 2)
   - 저장 및 확인

2. **RiskAssessmentDetailPage.tsx 수정** (상세보기)
   - 문서번호 표시 제거 (Task 3)
   - 저장 및 확인

3. **브라우저 테스트**
   - 개발 서버 실행
   - 목록 화면 확인
   - 상세보기 화면 확인

4. **완료 확인**
   - 모든 검증 항목 체크
   - 사용자 확인 요청

---

## 🔮 향후 계획 (Phase 2)

### 근로자 문서 확인 기능
- **위치**: 상세보기 내 별도 탭 또는 섹션
- **최초/정기**: 작업기간 중 확인한 근로자 명단
- **수시/상시**: TBM 진행 여부 및 참석자 관리

### TBM (Tool Box Meeting) 기능
- 상시 위험성평가와 연동
- 매일 진행 여부 체크
- TBM 문서 생성 기능

### 데이터 재활용
- 현재 유지 중인 `workerCount`, `unconfirmedCount` 사용
- 백엔드 API 연동 시 즉시 활용 가능

---

## 📌 주의사항

1. **데이터 필드 유지**
   - `workerCount`, `unconfirmedCount` 필드는 삭제하지 말 것
   - 추후 기능 개발 시 재사용 예정

2. **documentId 보존**
   - UI에서만 숨김
   - 변수 및 로직은 모두 유지
   - 서버 통신, 라우팅, localStorage 키 등에 사용 중

3. **Mock 데이터 불변**
   - MOCK_ASSESSMENTS 배열 변경 없음
   - 기존 테스트 데이터 유지

4. **타입 정의 유지**
   - RiskAssessment interface 변경 없음
   - 선택적 필드(`?`)로 정의되어 있어 문제없음

---

## 🎉 완료 기준

- 목록 테이블: 6개 컬럼 (소속, 작업기간, 작업공종, 작성자, 구분, 결재상태)
- 상세보기: 문서번호 텍스트 미표시
- 모든 기능 정상 동작
- 사용자 승인

---

**작성자**: Prometheus
**검토자**: (미정)
**승인자**: 사용자
