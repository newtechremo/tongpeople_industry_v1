# A01 회사코드 입력 (Company Code)

> **화면 ID**: A01
> **파일명**: `01-company-code.md`
> **상태**: Phase 1 MVP

---

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **화면명** | 회사코드 입력 |
| **영문명** | Company Code Entry |
| **접근 조건** | 미로그인 상태 |
| **이전 화면** | 없음 (앱 시작점) |
| **다음 화면** | A02 현장 선택 (2개+) 또는 A03 전화번호 입력 (1개) |

---

## 2. 레이아웃 구조

```
┌─────────────────────────────────────┐
│                                     │
│           (상단 여백)                │
│                                     │
│         ┌─────────────┐            │
│         │    로고      │            │
│         │  산업현장통   │            │
│         └─────────────┘            │
│                                     │
│      회사코드를 입력해주세요          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         ABC123              │   │
│  └─────────────────────────────┘   │
│                                     │
│    * 코드를 모르시면 관리자에게        │
│      문의해주세요                    │
│                                     │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │           다음               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 3. UI 컴포넌트

### 3.1 로고 영역

| 요소 | 스펙 |
|------|------|
| 로고 이미지 | 80x80px, 중앙 정렬 |
| 서비스명 | "산업현장통", H2, Slate 800, 중앙 |
| 위치 | 상단에서 120px |

### 3.2 안내 텍스트

| 요소 | 스펙 |
|------|------|
| 메인 텍스트 | "회사코드를 입력해주세요" |
| 폰트 | H3 (20px, SemiBold) |
| 색상 | Slate 800 |
| 정렬 | 중앙 |
| 위치 | 로고 아래 40px |

### 3.3 입력 필드

| 요소 | 스펙 |
|------|------|
| 높이 | 56px |
| 테두리 | 2px, Gray 300 |
| 모서리 | 16px (rounded-2xl) |
| 플레이스홀더 | "회사코드 입력" |
| 폰트 | 24px, Bold, 중앙 정렬 |
| 글자 간격 | 4px (tracking-wider) |
| 키보드 | 영문+숫자 (autoCapitalize="characters") |
| 자동 대문자 | 활성화 |
| **maxLength** | **20** |
| **minLength** | **4** (버튼 활성화 기준) |

```tsx
<TextInput
  placeholder="회사코드 입력"
  maxLength={20}
  autoCapitalize="characters"
  autoCorrect={false}
  keyboardType="default"
  className="w-full h-14 rounded-2xl border-2 border-gray-300
             text-center text-2xl font-bold tracking-wider
             focus:border-orange-500"
  onChangeText={(text) => setCode(filterCompanyCode(text))}
/>
```

### 3.4 힌트 텍스트

| 요소 | 스펙 |
|------|------|
| 텍스트 | "* 코드를 모르시면 관리자에게 문의해주세요" |
| 폰트 | Body S (12px) |
| 색상 | Slate 400 |
| 정렬 | 중앙 |
| 위치 | 입력 필드 아래 12px |

### 3.5 다음 버튼

| 요소 | 스펙 |
|------|------|
| 높이 | 52px |
| 너비 | 전체 - 32px (좌우 16px 패딩) |
| 모서리 | 12px (rounded-xl) |
| 배경 | Orange Gradient (비활성: Gray 200) |
| 텍스트 | "다음", White, 16px Bold |
| 위치 | 하단에서 Safe Area + 16px |

---

## 4. 상태별 UI 변화

### 4.1 Default (초기)

```
입력 필드: 빈 상태, 플레이스홀더 표시
버튼: 비활성 (bg-gray-200, text-gray-400)
```

### 4.2 Typing (입력 중)

```
입력 필드: border-orange-500
버튼: 활성화 (Orange Gradient)
```

### 4.3 Error (오류)

```
입력 필드: border-red-500
에러 메시지: "유효하지 않은 회사코드입니다" (red-600, 입력 필드 아래)
버튼: 활성 상태 유지
```

### 4.4 Loading (검증 중)

```
버튼: 로딩 스피너 표시
     텍스트 "확인 중..." + 스피너
     터치 비활성
```

---

## 5. 인터랙션

### 5.1 입력 검증

| 항목 | 규칙 |
|------|------|
| 최소 길이 | 4자 이상 (미만 시 버튼 비활성) |
| 최대 길이 | 20자 (maxLength 제한) |
| 허용 문자 | 영문 대문자, 숫자 |
| 자동 변환 | 소문자 → 대문자 |
| 특수문자 | 자동 제거 (하이픈, 공백 등) |
| 붙여넣기 | 20자 초과 시 앞 20자만 적용 |

### 5.2 입력 필터링 로직

```typescript
const filterCompanyCode = (input: string): string => {
  return input
    .toUpperCase()                    // 대문자 변환
    .replace(/[^A-Z0-9]/g, '')        // 영문+숫자만 허용
    .slice(0, 20);                    // 최대 20자 제한
};
```

### 5.3 테스트 케이스

| 케이스 | 입력 | 결과 |
|--------|------|------|
| 짧은 코드 | `ABC` (3자) | 버튼 비활성화 |
| 정상 코드 | `ABC123` (6자) | 정상 동작 |
| 최대 길이 | 키보드 21자 입력 | 20자에서 멈춤 |
| 긴 텍스트 붙여넣기 | 100자 붙여넣기 | 앞 20자만 입력 |
| 특수문자 포함 | `ABC-123` | `ABC123` (하이픈 제거) |
| 소문자 입력 | `abc123` | `ABC123` (대문자 변환) |
| 공백 포함 | `ABC 123` | `ABC123` (공백 제거) |

### 5.4 버튼 클릭 시

```
1. 입력값 유효성 검사
2. API 호출: POST /verify-company-code
3. 성공 시:
   - 현장 1개: A03 전화번호 입력으로 이동
   - 현장 2개+: A02 현장 선택으로 이동
4. 실패 시: 에러 상태 표시
```

### 5.5 키보드 처리

```
- Return 키: [다음] 버튼과 동일 동작
- 키보드 표시 시: 화면 스크롤 또는 레이아웃 조정
```

---

## 6. API 연동

### Request

```typescript
POST /functions/v1/verify-company-code

{
  "companyCode": "ABC123"
}
```

### Response (성공)

```typescript
{
  "success": true,
  "company": {
    "id": "uuid-company",
    "name": "(주)리모테크",
    "logo": "https://..."
  },
  "sites": [
    { "id": "uuid-site-1", "name": "강남 본사" },
    { "id": "uuid-site-2", "name": "대전 공장" }
  ]
}
```

### Response (실패)

```typescript
{
  "success": false,
  "error": "INVALID_CODE",
  "message": "유효하지 않은 회사코드입니다"
}
```

---

## 7. 에러 처리

| 에러 코드 | 메시지 | 처리 |
|----------|--------|------|
| `INVALID_CODE` | 유효하지 않은 회사코드입니다 | 입력 필드 에러 상태 |
| `EXPIRED_CODE` | 만료된 회사코드입니다 | 입력 필드 에러 상태 |
| `NETWORK_ERROR` | 네트워크 오류가 발생했습니다 | 토스트 + 재시도 유도 |

---

## 8. 접근성 (A11y)

| 요소 | 접근성 라벨 |
|------|------------|
| 입력 필드 | "회사코드 입력" |
| 다음 버튼 | "다음 단계로 이동" |
| 에러 메시지 | 자동 읽기 (live region) |

---

## 9. 디자인 토큰

```tsx
// 색상
const colors = {
  background: 'bg-white',
  inputBorder: 'border-gray-300',
  inputBorderFocus: 'border-orange-500',
  inputBorderError: 'border-red-500',
  buttonActive: 'bg-gradient-to-r from-orange-500 to-orange-600',
  buttonDisabled: 'bg-gray-200',
  textPrimary: 'text-slate-800',
  textHint: 'text-slate-400',
  textError: 'text-red-600',
};

// 간격
const spacing = {
  screenPadding: 'px-4',
  logoTop: 'mt-[120px]',
  inputMargin: 'mt-10',
  hintMargin: 'mt-3',
  buttonBottom: 'mb-4', // + safe area
};
```

---

## 10. Figma 프레임 목록

| 프레임명 | 설명 |
|----------|------|
| `A01 회사코드 / Default` | 초기 상태 |
| `A01 회사코드 / Typing` | 입력 중 |
| `A01 회사코드 / Error` | 오류 상태 |
| `A01 회사코드 / Loading` | 검증 중 |
