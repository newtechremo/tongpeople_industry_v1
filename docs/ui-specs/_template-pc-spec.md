# {화면명} - 구현 명세서

> **원본**: `{파일경로}`
> **생성일**: {YYYY-MM-DD}
> **플랫폼**: PC (admin-web)
> **문서 유형**: 구현 명세서 (2단계)
> **기획 문서**: `docs/ui-specs/pc/plans/{기획문서명}`

---

## 1. 컴포넌트 구조

### 1.1 컴포넌트 트리
```
{PageName}
├── Header
│   ├── PageTitle
│   └── ActionButtons
├── FilterSection
│   ├── SearchInput
│   └── FilterDropdowns
├── ContentSection
│   ├── DataTable / DataList
│   │   └── TableRow / ListItem
│   └── EmptyState (조건부)
├── Pagination
└── Modal (조건부)
    └── ModalContent
```

### 1.2 파일 구조
```
src/pages/{feature}/
├── {PageName}.tsx           # 메인 페이지
├── components/
│   ├── {Feature}Table.tsx   # 테이블 컴포넌트
│   ├── {Feature}Row.tsx     # 행 컴포넌트
│   ├── {Feature}Modal.tsx   # 모달 컴포넌트
│   └── {Feature}Filter.tsx  # 필터 컴포넌트
└── hooks/
    └── use{Feature}.ts      # 커스텀 훅
```

---

## 2. 컴포넌트 매핑

### 2.1 매핑 결과 요약
| 상태 | 개수 |
|------|------|
| ✅ 기존 사용 | {N}개 |
| 🆕 신규 필요 | {N}개 |
| ⚠️ 수정 필요 | {N}개 |

### 2.2 상세 매핑

| UI 요소 | 상태 | 컴포넌트 | 경로 |
|---------|------|----------|------|
| 페이지 레이아웃 | ✅ | `Layout` | `src/components/layout/Layout.tsx` |
| 테이블 | ✅ | `Table` | `src/components/common/Table.tsx` |
| 버튼 | ✅ | `Button` | `src/components/common/Button.tsx` |
| 검색 입력 | ✅ | `SearchInput` | `src/components/common/SearchInput.tsx` |
| 모달 | ✅ | `Modal` | `src/components/common/Modal.tsx` |
| {신규 컴포넌트1} | 🆕 | `{ComponentName}` | - |
| {신규 컴포넌트2} | 🆕 | `{ComponentName}` | - |
| {수정 컴포넌트} | ⚠️ | `{ComponentName}` | `{경로}` |

---

## 3. 신규 컴포넌트 명세

### 3.1 {ComponentName1}

**목적**: {컴포넌트의 역할}

**Props Interface**:
```typescript
interface {ComponentName}Props {
  // 필수 props
  data: {DataType};

  // 선택 props
  className?: string;
  onClick?: () => void;
}
```

**사용 예시**:
```tsx
<{ComponentName}
  data={item}
  onClick={handleClick}
/>
```

### 3.2 {ComponentName2}
...

---

## 4. 수정 필요 컴포넌트

### 4.1 {ComponentName}

**현재 경로**: `{경로}`

**수정 내용**:
- {수정사항 1}
- {수정사항 2}

**수정 방향**:
```typescript
// 기존
{현재 코드}

// 변경
{수정된 코드}
```

---

## 5. 스타일링 가이드

### 5.1 레이아웃
```tsx
// 페이지 컨테이너
<div className="space-y-6">

// 헤더 영역
<div className="flex items-center justify-between">
  <h1 className="text-xl font-black tracking-tight text-slate-800">
    {제목}
  </h1>
</div>

// 카드 컨테이너
<div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
```

### 5.2 테이블
```tsx
// 테이블 헤더
<th className="px-6 py-4 text-left text-sm font-black uppercase tracking-widest text-slate-500">

// 테이블 행
<tr className="hover:bg-orange-50 transition-colors cursor-pointer">

// 테이블 셀
<td className="px-6 py-4 text-sm text-slate-600">
```

### 5.3 버튼
```tsx
// Primary 버튼
className="px-5 py-2.5 rounded-xl font-bold text-white
           bg-gradient-to-r from-orange-500 to-orange-600
           hover:from-orange-600 hover:to-orange-700"

// Secondary 버튼
className="px-4 py-2 rounded-lg font-medium text-slate-600
           bg-slate-100 hover:bg-slate-200"
```

### 5.4 색상 참조
| 용도 | Tailwind 클래스 | HEX |
|------|-----------------|-----|
| Primary | `orange-500` | `#F97316` |
| Primary Light | `orange-50` | `#FFF7ED` |
| Text Primary | `slate-800` | `#1E293B` |
| Text Secondary | `slate-500` | `#64748B` |
| Border | `gray-200` | `#E5E7EB` |

---

## 6. 상태 관리

### 6.1 서버 상태 (React Query)

```typescript
// 목록 조회
const { data, isLoading, error } = useQuery({
  queryKey: ['{resource}', filters],
  queryFn: () => get{Resource}List(filters),
});

// 생성/수정
const mutation = useMutation({
  mutationFn: (data) => create{Resource}(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['{resource}'] });
  },
});
```

### 6.2 로컬 상태

```typescript
// 필터 상태
const [filters, setFilters] = useState<FilterState>({
  search: '',
  status: 'all',
  page: 1,
});

// 모달 상태
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<{Type} | null>(null);
```

---

## 7. 디자인 시스템 참조

**참조 문서**: `docs/design_guideline_251221.md`

| 항목 | 섹션 |
|------|------|
| 색상 | Primary Colors |
| 타이포그래피 | Typography Scale |
| 버튼 | Button Variants |
| 카드 | Card Styles |

---

## 8. 구현 체크리스트

- [ ] 페이지 컴포넌트 생성 (`src/pages/{feature}/{PageName}.tsx`)
- [ ] 라우트 등록 (`src/App.tsx` 또는 `src/routes/`)
- [ ] 사이드바 메뉴 추가
- [ ] API 함수 생성 (`src/api/{feature}.ts`)
- [ ] React Query 훅 생성
- [ ] 신규 컴포넌트 구현
- [ ] 기존 컴포넌트 수정 (해당 시)
- [ ] 반응형 레이아웃 확인
- [ ] 로딩/에러/빈 상태 처리

---

## 9. 연결 문서

- **기획 문서**: `docs/ui-specs/pc/plans/{기획문서명}`
- **디자인 가이드**: `docs/design_guideline_251221.md`
- **API 명세**: `docs/api/{관련API}.md` (있는 경우)
