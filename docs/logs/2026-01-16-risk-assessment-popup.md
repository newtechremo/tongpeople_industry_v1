# 위험성평가 만들기 팝업 개선

> **날짜**: 2026-01-16
> **브랜치**: `task_bang`
> **작업자**: Claude Code

---

## 작업 내용

### 문제점
- 필터 선택 (예: 수시) 후 "만들기" 클릭 시 유형 선택 페이지로 이동
- 이미 선택한 유형을 다시 선택해야 하는 비효율적 UX

### 해결 방안
1. **특정 필터 선택 상태**: 바로 폼 페이지로 이동
2. **전체 필터 선택 상태**: 모달 팝업으로 유형 선택

---

## 변경 파일

### 신규 생성
| 파일 | 설명 |
|------|------|
| `src/components/risk-assessment/AssessmentTypeSelectModal.tsx` | 유형 선택 모달 |
| `src/pages/risk-assessment/CreateAssessmentPage.tsx` | 만들기 폼 페이지 (빈 틀) |

### 수정
| 파일 | 변경 내용 |
|------|----------|
| `src/pages/RiskAssessmentPage.tsx` | 유형 선택 페이지 삭제, 팝업 로직 추가 |
| `src/App.tsx` | `/safety/risk/create/:type` 라우트 추가 |

---

## 모달 UI

```
┌─────────────────────────────────────┐
│ 위험성평가 유형 선택           [X]  │
├─────────────────────────────────────┤
│                                     │
│  ○ 최초 위험성평가  [?]            │
│  ○ 정기 위험성평가  [?]            │
│  ○ 수시 위험성평가  [?]            │
│  ○ 상시 위험성평가  [?]            │
│                                     │
│         [취소]  [선택완료]          │
└─────────────────────────────────────┘
```

- 라디오 버튼 리스트 (세로)
- 유형 순서: 최초 → 정기 → 수시 → 상시
- 물음표 아이콘 호버 시 툴팁 표시

---

## URL 매핑

| 유형 | URL 파라미터 |
|------|-------------|
| 최초 | `/safety/risk/create/initial` |
| 정기 | `/safety/risk/create/regular` |
| 수시 | `/safety/risk/create/occasional` |
| 상시 | `/safety/risk/create/continuous` |

---

## 향후 작업

- [ ] 유형별 만들기 폼 구현 (별도 계획 필요)
  - 최초 위험성평가 폼
  - 정기 위험성평가 폼
  - 수시 위험성평가 폼
  - 상시 위험성평가 폼

---

## 관련 문서

- 계획서: `.sisyphus/plans/risk-assessment-create-popup-plan.md`
- UI 명세서: `docs/ui-specs/pc/specs/2026-01-16-최초위험성평가상세보기-작업종료-구현.md`
