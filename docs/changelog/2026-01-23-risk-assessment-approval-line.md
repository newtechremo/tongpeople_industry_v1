# 위험성평가 결재라인 UI 개선

**날짜**: 2026-01-23
**브랜치**: feature/12-risk-assessment-approval-line
**작업자**: Claude Code

## 📋 작업 요약

위험성평가 만들기 및 상세 화면에서 결재라인 관련 UI를 개선하고, 사용자 경험을 향상시켰습니다.

---

## ✨ 주요 변경사항

### 1. 결재라인 선택 모달 개선

**파일**: `apps/admin-web/src/pages/risk-assessment/modals/ApprovalLineSelectModal.tsx`

**변경 내용**:
- 결재자 표시 방식을 텍스트 나열에서 **테이블 형식**으로 변경
- `ApproverPreviewTable` 컴포넌트 사용
- 직책(approvalTitle)과 이름(userName)을 구조화된 테이블로 표시
- 가독성 및 전문성 향상

**Before**:
```
정대호 · 김철수
```

**After**:
```
┌─────────┬─────────┐
│  검토자  │  승인자  │
├─────────┼─────────┤
│  정대호  │  김철수  │
└─────────┴─────────┘
```

---

### 2. 결재자 미리보기 테이블 컴포넌트 생성

**파일**: `apps/admin-web/src/components/common/ApproverPreviewTable.tsx` (신규)

**기능**:
- 결재자 목록을 테이블 형식으로 표시하는 재사용 가능한 컴포넌트
- 직책별로 컬럼 구성 (검토자, 승인자 등)
- 이름을 각 직책 아래 표시
- 가로 스크롤 지원 (결재자가 많을 경우)

**사용 예시**:
```tsx
<ApproverPreviewTable
  approvers={approvalLine.approvers}
  emptyLabel="결재자 없음"
/>
```

---

### 3. 위험성평가 유형 선택 모달 개선

**파일**: `apps/admin-web/src/components/risk-assessment/AssessmentTypeSelectModal.tsx`

**변경 내용**:
- 각 위험성평가 유형별 **상세 설명 추가**
- ? 아이콘 클릭 시 해당 카드 내부에 설명 확장 표시
- 최초/정기/수시/상시 각각의 실시 사유 및 대상자 안내

**추가된 설명 정보**:
- **최초 위험성평가**: 6가지 실시 항목 (작업대상자, 위험성평가 대상, 작업 내용 등)
- **정기 위험성평가**: 매분기 정기 시행 안내
- **수시 위험성평가**: 6가지 실시 사유 (작업 변경, 재해 발생, 유해물질 도입 등)
- **상시 위험성평가**: 일상 작업 모니터링 안내

**UI 개선**:
- 호버 툴팁 제거 → 카드 내부 확장 방식으로 변경
- 설명 영역이 각 카드와 시각적으로 연결 (테두리 공유)
- ? 아이콘 클릭 시 오렌지색으로 변경 (활성 상태 표시)
- 모달 높이 자동 조정 및 스크롤 지원

---

### 4. 기타 개선사항

**파일**:
- `apps/admin-web/src/components/risk-assessment/forms/InitialAssessmentForm.tsx`
- `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`

**변경 내용**:
- 결재라인 선택 모달에서 `ApproverPreviewTable` 컴포넌트 import 및 사용
- 기존 텍스트 표시 방식을 테이블 형식으로 교체
- 코드 일관성 유지

---

## 🎨 디자인 시스템 준수

- **테이블 스타일**: 깔끔한 그리드 레이아웃, 회색 테두리
- **폰트**: 텍스트 크기 `text-xs`, 중간 굵기 `font-medium`
- **색상**: 슬레이트 계열 (`slate-600`, `slate-500`)
- **간격**: 적절한 패딩 (`px-4 py-2`)

---

## 🐛 버그 수정

**파일**: `apps/admin-web/src/pages/risk-assessment/modals/ApprovalLineSelectModal.tsx`

**문제**: 중복된 닫는 중괄호로 인한 구문 오류 (64번째 줄)
```javascript
// Before (오류)
});
});  // 중복

// After (수정)
});
```

**영향**: 개발 서버 컴파일 오류 해결

---

## 📦 새로 추가된 파일

1. `apps/admin-web/src/components/common/ApproverPreviewTable.tsx`
   - 결재자 미리보기 테이블 컴포넌트

---

## 🔧 개발 환경 설정

- **Mock 데이터 사용**: 실제 DB 없이 개발 진행
- **개발 서버**: http://localhost:5173/
- **로컬 Supabase**: 리소스 확보를 위해 중지

---

## ✅ 테스트 항목

- [x] 결재라인 선택 모달에서 테이블 형식 표시 확인
- [x] 위험성평가 유형별 ? 클릭 시 상세 설명 표시
- [x] 카드 확장/축소 토글 동작
- [x] 개발 서버 정상 실행
- [x] HMR (Hot Module Replacement) 정상 동작

---

## 📝 향후 개선 방향

1. **결재 진행 상태 표시**: 결재자별 승인/반려 상태 시각화
2. **전자서명 기능**: 결재자가 직접 서명할 수 있는 기능
3. **알림 기능**: 결재 요청/승인 시 알림 전송
4. **이력 관리**: 결재 진행 이력 추적 및 표시

---

## 🔗 관련 이슈

- Issue #12: 위험성평가 결재라인 기능 개선

---

## 📸 스크린샷

참고 파일:
- `docs/risk-assessment/화면 캡처 2026-01-23 154136.png` - 결재라인 선택 모달
- `docs/화면 캡처 2026-01-23 170437.png` - 개발 서버 확인

---

## 💬 비고

- Figma 디자인 참조: `docs/risk-assessment/figma/` 폴더
- 프로덕션 DB 보호를 위해 Mock 데이터로 개발 진행
- 실제 데이터 연동은 추후 백엔드 팀과 협의 필요
