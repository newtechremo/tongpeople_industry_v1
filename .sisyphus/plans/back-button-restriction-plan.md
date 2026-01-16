# 뒤로가기 버튼 제한 설계 계획

> **작성일**: 2026-01-15
> **상태**: 승인 대기
> **범위**: 회원가입 플로우 (A01~A08)

---

## 1. 개요

회원가입 플로우에서 뒤로가기 버튼이 동작하면 안 되거나 경고가 필요한 화면을 식별하고, 각 화면별 대응 방안을 정의한다.

### 1.1 핵심 우려사항
- **휴대폰 인증 완료 후** 뒤로가기 → 인증 재시작 방지
- **폼 작성 중** 뒤로가기 → 입력 데이터 손실 방지
- **가입 완료 후** 뒤로가기 → 가입 플로우 재진입 방지

---

## 2. 화면별 뒤로가기 처리 방안

### 2.1 뒤로가기 허용 (인증 완료 전)

| 화면 | 뒤로가기 | 이동 대상 | 이유 |
|------|:-------:|----------|------|
| **A03 전화번호** | ✅ 허용 | A02 현장선택 | 현장 재선택 가능 |
| **A04 인증번호** | ✅ 허용 | A03 전화번호 | 번호 재입력 가능 (인증 전) |

> **허용 이유:** 아직 인증이 완료되지 않은 상태이므로, 사용자가 전화번호를 잘못 입력했거나 현장을 잘못 선택했을 때 자유롭게 돌아갈 수 있어야 함.

### 2.2 네비게이션 스택 제어 (인증 완료 후)

| 전환 | 처리 방식 | 설명 |
|------|----------|------|
| **A04 → A05** | `router.replace('/info-input')` | 인증 완료 후 A04를 스택에서 제거 |
| **A07 → A08** | `router.reset({ routes: [{ name: 'WaitingApproval' }] })` | 가입 완료 후 전체 스택 초기화 |
| **A07 → 홈** | `router.reset({ routes: [{ name: 'Home' }] })` | 선등록 회원 가입 완료 후 스택 초기화 |

### 2.3 경고 팝업 표시 (데이터 손실 방지)

| 화면 | 조건 | 팝업 문구 |
|------|------|----------|
| **A05 정보입력** | 하나 이상의 필드에 입력값이 있을 때 | 제목: "정보 입력을 중단하시겠습니까?"<br>설명: "입력한 정보가 저장되지 않습니다." |
| **A06 약관동의** | 하나 이상의 약관에 동의했을 때 | 제목: "약관 동의를 중단하시겠습니까?"<br>설명: "동의 내용이 저장되지 않습니다." |

### 2.4 이미 처리된 화면

| 화면 | 현재 설계 | 비고 |
|------|----------|------|
| **A07 전자서명** | "다시 쓰기" 버튼에 확인 팝업 있음 | 뒤로가기 시에도 동일 팝업 적용 권장 |
| **A08 승인대기** | 뒤로가기 버튼 없음, 시스템 뒤로가기 무시 | 완료 ✅ |

---

## 3. 상세 구현 스펙

### 3.1 A04 → A05 전환 (인증 완료 후)

**현재 문제:**
```
A04에서 인증 성공 → A05로 이동 → 뒤로가기 → A04 다시 표시
→ 인증번호 만료, 재인증 필요
```

**해결책:**
```typescript
// A04 인증 성공 시
const handleVerifySuccess = () => {
  // push 대신 replace 사용
  router.replace('/info-input', { phoneNumber, preRegisteredData });
};
```

**사용자 경험:**
- A05에서 뒤로가기 → A03(전화번호 입력) 또는 A02/A01로 이동
- 인증 과정 스킵, 처음부터 다시 시작

---

### 3.2 A05 정보입력 뒤로가기 경고

**조건:** 다음 중 하나라도 입력된 경우
- 이름, 생년월일, 이메일, 성별, 국적, 소속팀, 직책

**팝업 스펙:**
```
┌─────────────────────────────────────┐
│                                     │
│              ⚠️                     │
│                                     │
│    정보 입력을 중단하시겠습니까?      │
│                                     │
│    입력한 정보가 저장되지 않습니다.   │
│                                     │
│   ┌─────────┐    ┌─────────┐       │
│   │  취소   │    │  나가기  │       │
│   └─────────┘    └─────────┘       │
│                                     │
└─────────────────────────────────────┘

유형: Warning Popup
아이콘: AlertTriangle, Amber 500
제목: "정보 입력을 중단하시겠습니까?"
설명: "입력한 정보가 저장되지 않습니다."
취소: Gray (Secondary) - 팝업 닫기
나가기: Orange Gradient (Primary) - 이전 화면으로 이동
```

**구현 코드:**
```typescript
// A05 정보입력 화면
const [showExitWarning, setShowExitWarning] = useState(false);

const hasUnsavedData = useMemo(() => {
  return !!(name || birthDate || email || gender || nationality || teamId || jobTitle);
}, [name, birthDate, email, gender, nationality, teamId, jobTitle]);

// 뒤로가기 인터셉트
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (hasUnsavedData) {
      setShowExitWarning(true);
      return true; // 기본 동작 방지
    }
    return false; // 기본 뒤로가기 허용
  });

  return () => backHandler.remove();
}, [hasUnsavedData]);
```

---

### 3.3 A06 약관동의 뒤로가기 경고

**조건:** 하나 이상의 약관에 동의한 경우

**팝업 스펙:**
```
┌─────────────────────────────────────┐
│                                     │
│              ⚠️                     │
│                                     │
│    약관 동의를 중단하시겠습니까?      │
│                                     │
│    동의 내용이 저장되지 않습니다.     │
│                                     │
│   ┌─────────┐    ┌─────────┐       │
│   └─────────┘    └─────────┘       │
│                                     │
└─────────────────────────────────────┘

유형: Warning Popup
아이콘: AlertTriangle, Amber 500
제목: "약관 동의를 중단하시겠습니까?"
설명: "동의 내용이 저장되지 않습니다."
취소: Gray (Secondary)
나가기: Orange Gradient (Primary)
```

---

### 3.4 A07 전자서명 뒤로가기 경고

**조건:** 서명이 입력된 경우

**팝업 스펙:**
```
┌─────────────────────────────────────┐
│                                     │
│              ⚠️                     │
│                                     │
│    서명 입력을 중단하시겠습니까?      │
│                                     │
│    작성한 서명이 저장되지 않습니다.   │
│                                     │
│   ┌─────────┐    ┌─────────┐       │
│   │  취소   │    │  나가기  │       │
│   └─────────┘    └─────────┘       │
│                                     │
└─────────────────────────────────────┘

유형: Warning Popup
제목: "서명 입력을 중단하시겠습니까?"
설명: "작성한 서명이 저장되지 않습니다."
```

---

### 3.5 A07 → A08/홈 전환 (가입 완료 후)

**현재 문제:**
```
A07 서명 → 가입 완료 → A08 승인대기 → 뒤로가기 → A07 다시 표시
→ 이미 가입 완료된 상태에서 혼란 발생
```

**해결책:**
```typescript
// A07 가입 완료 시
const handleRegisterSuccess = (response) => {
  if (response.status === 'REQUESTED') {
    // 직접가입: 승인대기 화면으로 이동 (스택 초기화)
    router.reset({
      index: 0,
      routes: [{ name: 'WaitingApproval' }],
    });
  } else if (response.status === 'ACTIVE') {
    // 선등록 회원: 홈으로 이동 (스택 초기화)
    router.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }
};
```

---

## 4. 플로우 다이어그램

```
[인증 완료 전 - 뒤로가기 허용]

┌─────────┐  ◄──  ┌─────────┐  ◄──  ┌─────────┐
│   A02   │  허용  │   A03   │  허용  │   A04   │
│현장선택 │  ──►  │ 전화번호 │  ──►  │  인증   │
└─────────┘       └─────────┘       └────┬────┘
                                         │ 인증 성공
                                         │ (replace)
[인증 완료 후 - 뒤로가기 제한]            ▼
                                    ┌─────────┐
                                    │   A05   │ ←── 경고팝업
                                    │ 정보입력 │
                                    └────┬────┘
                                         │
                                         ▼
                                    ┌─────────┐
                                    │   A06   │ ←── 경고팝업
                                    │ 약관동의 │
                                    └────┬────┘
                                         │
                                         ▼
                                    ┌─────────┐
                                    │   A07   │ ←── 경고팝업
                                    │ 전자서명 │
                                    └────┬────┘
                                         │ 가입 완료
                                         │ (reset)
                    ┌────────────────────┴────────────────────┐
                    │                                         │
              ┌─────▼─────┐                            ┌──────▼──────┐
              │    A08    │                            │      홈      │
              │  승인대기  │                            │   (ACTIVE)   │
              │ (REQUESTED)│                            └─────────────┘
              └───────────┘
               뒤로가기 차단
```

---

## 5. 문서 업데이트 필요 사항

### 5.1 신규 추가 필요
- `00-common-popup-modal.md`에 뒤로가기 경고 팝업 3개 추가

### 5.2 기존 문서 수정
| 문서 | 수정 내용 |
|------|----------|
| `04-verify-code.md` | 인증 성공 시 `replace` 네비게이션 명시 |
| `05-info-input.md` | 뒤로가기 경고 팝업 섹션 추가 |
| `06-terms-agreement.md` | 뒤로가기 경고 팝업 섹션 추가 |
| `07-signature.md` | 뒤로가기 경고 팝업 섹션 추가, 가입 완료 시 `reset` 명시 |

---

## 6. 구현 체크리스트

### Phase 1: 문서 업데이트
- [ ] `00-common-popup-modal.md`에 뒤로가기 경고 팝업 추가
- [ ] `04-verify-code.md` 수정
- [ ] `05-info-input.md` 수정
- [ ] `06-terms-agreement.md` 수정
- [ ] `07-signature.md` 수정

### Phase 2: 코드 구현 (추후)
- [ ] BackHandler 훅 공통 컴포넌트 개발
- [ ] 각 화면에 뒤로가기 로직 적용
- [ ] 네비게이션 전환 로직 수정

---

## 7. 참고 사항

### 7.1 React Native BackHandler 패턴
```typescript
// 공통 훅으로 추출 권장
const useBackHandler = (
  condition: boolean,
  onBack: () => void
) => {
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (condition) {
        onBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [condition, onBack]);
};
```

### 7.2 Expo Router에서의 처리
```typescript
// Expo Router 사용 시
import { useRouter, useNavigation } from 'expo-router';

// replace
router.replace('/info-input');

// reset (스택 초기화)
router.dismissAll();
router.replace('/home');
```
