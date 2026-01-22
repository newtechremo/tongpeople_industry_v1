# 위험성평가 만들기 팝업 개선 계획서

> **생성일**: 2026-01-16
> **브랜치**: `task_bang`
> **범위**: 팝업 로직만 (폼 화면은 별도 계획)

---

## 1. 현재 상태

### 문제점
```
필터 선택 (예: 수시) → "만들기" 클릭 → 유형 선택 페이지 → 다시 유형 선택 필요
```
- 사용자가 이미 필터로 유형을 선택한 상태에서 만들기를 눌렀는데, 다시 유형을 선택해야 함
- 비효율적인 UX

### 현재 코드 구조
```
RiskAssessmentPage.tsx (517줄, 단일 파일)
├── view: 'list' | 'create'
├── 목록 화면 (list)
└── 유형 선택 화면 (create) ← 삭제 예정
```

---

## 2. 개선 방향

### 새로운 동작
```
Case 1: 특정 필터 선택 상태 (수시/최초/정기/상시)
  → "만들기" 클릭 → 바로 /safety/risk/create/:type 으로 이동

Case 2: 전체 필터 선택 상태
  → "만들기" 클릭 → 유형 선택 팝업 표시 → 선택 후 /safety/risk/create/:type 으로 이동
```

### 팝업 디자인
- **형태**: 모달 팝업
- **유형 표시**: 라디오 버튼 리스트 (세로)
- **유형 순서**: 최초 → 정기 → 수시 → 상시
- **설명 표시**: 물음표(?) 아이콘 + 툴팁 (hover 시)

---

## 3. 작업 항목

### 3.1 신규 컴포넌트 생성

| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| `AssessmentTypeSelectModal` | `src/components/risk-assessment/AssessmentTypeSelectModal.tsx` | 유형 선택 팝업 |

### 3.2 기존 파일 수정

| 파일 | 수정 내용 |
|------|----------|
| `RiskAssessmentPage.tsx` | 유형 선택 페이지 코드 삭제, 팝업 로직 추가 |
| `App.tsx` | `/safety/risk/create/:type` 라우트 추가 |

### 3.3 신규 페이지 생성 (빈 틀)

| 파일 | 설명 |
|------|------|
| `src/pages/risk-assessment/CreateAssessmentPage.tsx` | 만들기 폼 페이지 (빈 틀, 라우팅 확인용) |

---

## 4. 상세 구현 명세

### 4.1 AssessmentTypeSelectModal

```tsx
interface AssessmentTypeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: AssessmentType) => void;
}
```

**UI 구성:**
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

**툴팁 내용:**
- 최초: "사업장 최초 시공 시 1회 작성"
- 정기: "월/분기별 정기적으로 작성"
- 수시: "작업 변경 또는 위험 발생 시 작성"
- 상시: "일상적인 위험요인 관리용"

### 4.2 RiskAssessmentPage 수정

**삭제할 코드:**
- `view` state ('create' 관련)
- 유형 선택 화면 렌더링 부분 (return문 하단)

**추가할 코드:**
- `showTypeModal` state
- 팝업 컴포넌트 렌더링
- `handleCreateClick` 로직 수정:
  ```tsx
  const handleCreateClick = () => {
    if (filterType !== 'ALL') {
      // 특정 유형 필터 선택 상태 → 바로 이동
      navigate(`/safety/risk/create/${filterType.toLowerCase()}`);
    } else {
      // 전체 필터 → 팝업 표시
      setShowTypeModal(true);
    }
  };
  ```

### 4.3 라우트 추가

```tsx
// App.tsx
<Route path="safety/risk/create/:type" element={<CreateAssessmentPage />} />
```

### 4.4 CreateAssessmentPage (빈 틀)

```tsx
export default function CreateAssessmentPage() {
  const { type } = useParams<{ type: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">
        {type?.toUpperCase()} 위험성평가 만들기
      </h1>
      <p className="text-slate-500">폼 구현 예정</p>
    </div>
  );
}
```

---

## 5. 유형 순서 및 매핑

| 순서 | ID | 라벨 | URL param |
|:----:|-----|------|-----------|
| 1 | INITIAL | 최초 위험성평가 | `initial` |
| 2 | REGULAR | 정기 위험성평가 | `regular` |
| 3 | OCCASIONAL | 수시 위험성평가 | `occasional` |
| 4 | CONTINUOUS | 상시 위험성평가 | `continuous` |

---

## 6. 체크리스트

- [ ] `AssessmentTypeSelectModal` 컴포넌트 생성
- [ ] `RiskAssessmentPage.tsx` 에서 유형 선택 페이지 코드 삭제
- [ ] `RiskAssessmentPage.tsx` 에 팝업 로직 추가
- [ ] `CreateAssessmentPage.tsx` 빈 틀 생성
- [ ] `App.tsx` 라우트 추가
- [ ] 테스트: 특정 필터 상태에서 만들기 클릭 → 바로 이동
- [ ] 테스트: 전체 필터 상태에서 만들기 클릭 → 팝업 → 선택 → 이동

---

## 7. 향후 작업 (별도 계획)

- 유형별 만들기 폼 구현 (UI 명세서 기반)
  - 최초 위험성평가 폼
  - 정기 위험성평가 폼
  - 수시 위험성평가 폼 (빈도/강도)
  - 상시 위험성평가 폼
