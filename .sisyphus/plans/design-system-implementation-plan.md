# 디자인 시스템 구현 계획

> **작성일**: 2026-01-15
> **상태**: 승인 대기
> **범위**: 모바일 앱 디자인 시스템 전체 구현

---

## 1. 개요

### 1.1 목표
산업현장통 모바일 앱의 디자인 시스템을 코드로 구현하여 일관된 UI/UX를 제공한다.

### 1.2 산출물
| 산출물 | 설명 |
|--------|------|
| **컴포넌트 코드** | React Native 공통 컴포넌트 |
| **테마/토큰 파일** | NativeWind 테마 설정, 색상/간격 상수 |
| **디자인 시스템 문서** | 기존 문서 보강 (입력 필드 상태 등) |

### 1.3 디자인 결정사항
| 항목 | 결정 |
|------|------|
| 기본 컬러 | 오렌지 (#F97316 ~ #EA580C) |
| 라운딩 | 12px (rounded-xl) 유지 |
| 폰트 | Pretendard |
| 입력 필드 상태 | 레퍼런스 기반 4단계 색상 정의 적용 |
| 헤더 스타일 | 오렌지 배경 + 흰색 텍스트 |

---

## 2. 입력 필드 상태별 색상 정의

레퍼런스를 오렌지 테마로 변환:

### 2.1 색상 매핑

| 상태 | 요소 | 레퍼런스 | 오렌지 적용 |
|------|------|---------|------------|
| **1. 입력 전** | 테두리 | #CBCBCB | #CBD5E1 (slate-300) |
| | 플레이스홀더 | #CBCBCB | #94A3B8 (slate-400) |
| **2. 입력 중** | 테두리 | #808080 | #F97316 (orange-500) |
| | 텍스트 | #191919 | #1E293B (slate-800) |
| **3. 입력 후** | 테두리 | #CBCBCB | #CBD5E1 (slate-300) |
| | 텍스트 | #191919 | #1E293B (slate-800) |
| **4. 입력 불가** | 테두리 | #CBCBCB | #E2E8F0 (slate-200) |
| | 배경 | #F7F7F7 | #F1F5F9 (slate-100) |
| | 텍스트 | #808080 | #94A3B8 (slate-400) |
| **5. 에러** | 테두리 | 빨강 | #DC2626 (red-600) |
| | 메시지 | 빨강 | #DC2626 (red-600) |
| **6. 성공** | 테두리 | 녹색 | #16A34A (green-600) |
| | 아이콘 | 녹색 | #16A34A (green-600) |

### 2.2 입력 필드 시각화

```
1. 입력 전 (Placeholder)
┌─────────────────────────────────────┐
│  시공사명을 입력하세요.                │  ← #94A3B8
└─────────────────────────────────────┘
   Border: #CBD5E1

2. 입력 중 (Focused)
┌─────────────────────────────────────┐
│  010 9571 4|                        │  ← #1E293B + 커서
└─────────────────────────────────────┘
   Border: #F97316 (2px)
   Ring: orange-100

3. 입력 후 (Filled)
┌─────────────────────────────────────┐
│  010 9571 4354                      │  ← #1E293B
└─────────────────────────────────────┘
   Border: #CBD5E1

4. 입력 불가 (Disabled)
┌─────────────────────────────────────┐
│  010 9571 4354                      │  ← #94A3B8
└─────────────────────────────────────┘
   Border: #E2E8F0
   Background: #F1F5F9

5. 에러 (Error)
┌─────────────────────────────────────┐
│  123-56-78944                       │
└─────────────────────────────────────┘
   Border: #DC2626
   올바른 형식으로 입력해주세요.  ← #DC2626

6. 성공 (Success)
┌─────────────────────────────────────┐
│  010-2481-7821                   ✓  │
└─────────────────────────────────────┘
   Border: #16A34A
   Icon: #16A34A
```

---

## 3. 헤더 스타일 정의

### 3.1 기본 헤더 (서브 페이지)

```
┌─────────────────────────────────────┐
│  ←       인증번호 확인               │
└─────────────────────────────────────┘

Background: #F97316 (orange-500)
Height: 56px
Title: White, 18px, SemiBold, Center
Back Icon: White, 24px
```

### 3.2 그라데이션 헤더 (옵션)

```
Background: linear-gradient(90deg, #F97316, #EA580C)
```

### 3.3 투명 헤더 (스플래시/로고 화면)

```
Background: Transparent
Status Bar: Light (흰색 아이콘)
```

---

## 4. 파일 구조

```
apps/worker-mobile/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx           # Primary, Secondary, Ghost, Danger
│   │   │   ├── Input.tsx            # TextInput with states
│   │   │   ├── Card.tsx             # 기본 카드
│   │   │   ├── Checkbox.tsx         # 체크박스
│   │   │   ├── Radio.tsx            # 라디오 버튼
│   │   │   ├── Select.tsx           # 드롭다운 (BottomSheet 연동)
│   │   │   ├── Toast.tsx            # 토스트 메시지
│   │   │   ├── Modal.tsx            # 모달/팝업
│   │   │   └── index.ts             # 배럴 export
│   │   ├── layout/
│   │   │   ├── Header.tsx           # 상단 헤더
│   │   │   ├── TabBar.tsx           # 하단 탭바
│   │   │   ├── ScreenWrapper.tsx    # 화면 래퍼 (SafeArea)
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── theme/
│   │   ├── colors.ts                # 색상 상수
│   │   ├── typography.ts            # 폰트 스타일
│   │   ├── spacing.ts               # 간격 상수
│   │   └── index.ts
│   └── hooks/
│       └── useTheme.ts              # 테마 훅
├── tailwind.config.js               # 기존 + 확장
└── global.css                       # 전역 스타일
```

---

## 5. 구현 순서

### Phase 1: 테마/토큰 파일 (기반)
- [ ] `src/theme/colors.ts` - 색상 상수 정의
- [ ] `src/theme/typography.ts` - 폰트 스타일 정의
- [ ] `src/theme/spacing.ts` - 간격 상수 정의
- [ ] `tailwind.config.js` 확장 - 입력 필드 상태 색상 추가

### Phase 2: 기본 UI 컴포넌트
- [ ] `Button.tsx` - 4가지 버튼 타입
- [ ] `Input.tsx` - 6가지 상태 지원
- [ ] `Card.tsx` - 기본 카드
- [ ] `Checkbox.tsx` - 체크박스
- [ ] `Radio.tsx` - 라디오 버튼

### Phase 3: 레이아웃 컴포넌트
- [ ] `Header.tsx` - 오렌지 배경 헤더
- [ ] `ScreenWrapper.tsx` - SafeArea 래퍼
- [ ] `TabBar.tsx` - 하단 탭바

### Phase 4: 고급 컴포넌트
- [ ] `Select.tsx` - 드롭다운 + BottomSheet
- [ ] `Toast.tsx` - 토스트 메시지
- [ ] `Modal.tsx` - 모달/팝업

### Phase 5: 문서 업데이트
- [ ] `design-system-mobile.md` 보강 - 입력 필드 상태 상세 추가
- [ ] 컴포넌트 사용 예시 문서화

---

## 6. 컴포넌트 상세 스펙

### 6.1 Button 컴포넌트

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}
```

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| primary | gradient orange-500→600 | white | none |
| secondary | white | slate-600 | gray-300 |
| danger | red-600 | white | none |
| ghost | transparent | orange-600 | none |

### 6.2 Input 컴포넌트

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  state?: 'default' | 'focused' | 'filled' | 'disabled' | 'error' | 'success';
  errorMessage?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  rightIcon?: React.ReactNode;
}
```

### 6.3 Header 컴포넌트

```typescript
interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'solid' | 'gradient' | 'transparent';
}
```

---

## 7. 코드 예시

### 7.1 colors.ts

```typescript
export const colors = {
  // Primary (Orange)
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },

  // Input States
  input: {
    default: {
      border: '#CBD5E1',      // slate-300
      placeholder: '#94A3B8', // slate-400
      text: '#1E293B',        // slate-800
    },
    focused: {
      border: '#F97316',      // orange-500
      ring: '#FFEDD5',        // orange-100
    },
    disabled: {
      border: '#E2E8F0',      // slate-200
      background: '#F1F5F9',  // slate-100
      text: '#94A3B8',        // slate-400
    },
    error: {
      border: '#DC2626',      // red-600
      text: '#DC2626',
    },
    success: {
      border: '#16A34A',      // green-600
      icon: '#16A34A',
    },
  },

  // Header
  header: {
    background: '#F97316',
    text: '#FFFFFF',
    icon: '#FFFFFF',
  },
} as const;
```

### 7.2 Input.tsx 핵심 로직

```typescript
const getInputStyles = (state: InputState) => {
  const baseStyles = 'w-full h-[52px] px-4 rounded-xl text-base';

  switch (state) {
    case 'focused':
      return `${baseStyles} border-2 border-orange-500 ring-2 ring-orange-100`;
    case 'disabled':
      return `${baseStyles} border border-slate-200 bg-slate-100 text-slate-400`;
    case 'error':
      return `${baseStyles} border-2 border-red-600`;
    case 'success':
      return `${baseStyles} border border-green-600`;
    default:
      return `${baseStyles} border border-slate-300`;
  }
};
```

### 7.3 Header.tsx

```typescript
export function Header({ title, showBack, onBack, variant = 'solid' }: HeaderProps) {
  const bgStyle = variant === 'gradient'
    ? 'bg-gradient-to-r from-orange-500 to-orange-600'
    : 'bg-orange-500';

  return (
    <View className={`h-14 flex-row items-center px-4 ${bgStyle}`}>
      {showBack && (
        <TouchableOpacity onPress={onBack} className="mr-4">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
      )}
      <Text className="flex-1 text-center text-lg font-semibold text-white">
        {title}
      </Text>
      {showBack && <View className="w-10" />}
    </View>
  );
}
```

---

## 8. 예상 소요 시간

| Phase | 항목 | 예상 |
|-------|------|------|
| 1 | 테마/토큰 파일 | 30분 |
| 2 | 기본 UI 컴포넌트 | 1시간 |
| 3 | 레이아웃 컴포넌트 | 30분 |
| 4 | 고급 컴포넌트 | 1시간 |
| 5 | 문서 업데이트 | 30분 |
| **합계** | | **3.5시간** |

---

## 9. 참고 자료

- 레퍼런스: `C:\hongtong\reference\figma\새 폴더\`
- 기존 디자인 시스템: `docs/figma/design-system-mobile.md`
- Tailwind 설정: `apps/worker-mobile/tailwind.config.js`
