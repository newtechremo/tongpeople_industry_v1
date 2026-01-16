# TongPassApp 추가 기능 구현 계획

> 작성일: 2026-01-16
> 참조: tongpeople_industry_v1/docs/signin/통패스_근로자앱_가입_PRD.md

---

## 1. 개요

tongpeople_industry_v1 저장소의 PRD 문서를 분석하여, TongPassApp에 추가로 구현해야 할 기능을 정리합니다.

### 참조 문서
| 문서 | 위치 |
|------|------|
| 근로자앱 가입 PRD | `tongpeople_industry_v1/docs/signin/통패스_근로자앱_가입_PRD.md` |
| 작업 로그 | `tongpeople_industry_v1/docs/작업로그_20260113_근로자가입.md` |

---

## 2. 구현 필요 기능

### 2.1 약관 상세 페이지 (TermsDetailScreen)

**현재 상태**: 약관 동의 화면에서 `>` 버튼이 있지만, 상세 페이지 없음

**PRD 명세 (섹션 6.4)**:
```
┌──────────────────────────────────┐
│ ☑ (필수) 서비스 이용약관      >  │
└──────────────────────────────────┘
```

**구현 내용**:
- 각 약관 항목 클릭 시 전체 내용을 보여주는 상세 화면
- 4개 약관 각각의 내용 표시

**약관 목록**:
| ID | 약관명 | 필수 |
|----|--------|:----:|
| `terms-service` | 서비스 이용약관 | O |
| `terms-privacy` | 개인정보 수집 및 이용 동의 | O |
| `terms-third-party` | 개인정보 제3자 제공 동의 | O |
| `terms-location` | 위치기반서비스 이용 약관 | O |

**파일 구조**:
```
src/screens/auth/
├── TermsScreen.tsx          # 기존 (수정)
└── TermsDetailScreen.tsx    # 신규
```

**네비게이션 추가**:
```typescript
// types/navigation.ts
type AuthStackParamList = {
  // ... 기존
  TermsDetail: {
    termId: string;
    title: string;
  };
};
```

---

### 2.2 기존 회원 로그인 분기

**현재 상태**: SMS 인증 후 항상 회원가입 플로우로 이동

**PRD 명세 (섹션 6.2)**:
> 인증 완료 후 분기:
> - 이미 가입된 번호 → 즉시 로그인 처리 → 메인 화면 이동
> - 미가입 번호 → 회원가입 정보 입력 단계로 이동

**API 응답 (verify-sms)**:
```json
{
  "verified": true,
  "isRegistered": true,           // 기존 회원
  "accessToken": "...",
  "refreshToken": "...",
  "workerId": "uuid",
  "status": "ACTIVE"              // 또는 "REQUESTED"
}
```

**구현 로직**:
```typescript
// PhoneVerifyScreen.tsx - handleVerify 함수
const result = await verifySms(phoneNumber, verifyCode);

if (result.isRegistered && result.accessToken) {
  // 기존 회원 → 즉시 로그인
  login(result.accessToken, result.refreshToken);
  setWorkerStatus(result.status);

  // 상태에 따라 화면 분기 (RootNavigator에서 처리)
  // - ACTIVE → HomeScreen
  // - REQUESTED → WaitingScreen
  return;
}

// 신규 회원 → 정보 입력 화면
navigation.navigate('WorkerInfo', { ... });
```

**현재 코드 확인 필요**: 이미 구현되어 있을 수 있음 (확인 후 테스트)

---

### 2.3 선등록 사용자 처리 (Pre-fill)

**현재 상태**: preRegisteredData를 받지만 활용하지 않음

**PRD 명세 (섹션 6.3)**:
> - API 응답에 `preRegisteredData`가 있다면, 입력 폼의 기본값으로 설정
> - 안내 메시지: "관리자가 등록한 정보를 불러왔습니다." (상단 배너)

**API 응답 (verify-sms)**:
```json
{
  "verified": true,
  "isRegistered": false,
  "preRegisteredData": {
    "name": "홍길동",
    "birthDate": "19850315",
    "gender": "M",
    "nationality": "KR",
    "teamId": "uuid",
    "jobTitle": "전기기사"
  }
}
```

**구현 내용**:
1. WorkerInfoScreen에서 `preRegisteredData` 파라미터 활용
2. 폼 초기값으로 설정
3. 상단에 안내 배너 표시
4. 데이터 수정 시 `isDataConflict: true` 플래그 전송

**UI 추가 (상단 배너)**:
```
┌────────────────────────────────────┐
│ ℹ️ 관리자가 등록한 정보를 불러왔습니다  │
│    정보가 다르면 수정해주세요.        │
└────────────────────────────────────┘
```

---

### 2.4 데이터 충돌 처리 (Conflict Logic)

**PRD 명세 (섹션 6.3)**:
> 1. 팝업: "관리자 등록 정보와 다릅니다. 입력한 정보로 가입하시겠습니까?"
> 2. [확인] 시: 서버에 `is_data_conflict: true` 플래그 전송
> 3. 관리자 확인: PC 관리자 페이지에서 "정보 불일치" 표시됨

**구현 로직**:
```typescript
// WorkerInfoScreen.tsx
const handleSubmit = () => {
  const isDataConflict = checkDataConflict(preRegisteredData, formData);

  if (isDataConflict) {
    Alert.alert(
      '정보 확인',
      '관리자 등록 정보와 다릅니다.\n입력한 정보로 가입하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: () => submitWithConflict(true) },
      ]
    );
    return;
  }

  submitWithConflict(false);
};
```

---

## 3. 구현 우선순위

| 순위 | 기능 | 난이도 | 소요 시간 |
|:----:|------|:------:|----------|
| 1 | 기존 회원 로그인 분기 | 낮음 | 코드 확인 후 테스트 |
| 2 | 약관 상세 페이지 | 중간 | 화면 1개 추가 |
| 3 | 선등록 사용자 Pre-fill | 중간 | 기존 화면 수정 |
| 4 | 데이터 충돌 처리 | 낮음 | Alert 추가 |

---

## 4. 상세 구현 계획

### 4.1 약관 상세 페이지

#### 4.1.1 신규 파일 생성
```
src/screens/auth/TermsDetailScreen.tsx
```

#### 4.1.2 약관 내용 상수 추가
```
src/constants/terms.ts
```

```typescript
export const TERMS_CONTENT = {
  'terms-service': {
    title: '서비스 이용약관',
    content: `제1조 (목적)
이 약관은 통패스(이하 "회사")가 제공하는 출퇴근 관리 서비스(이하 "서비스")의
이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
...`,
  },
  'terms-privacy': {
    title: '개인정보 수집 및 이용 동의',
    content: `1. 수집하는 개인정보 항목
- 필수: 이름, 휴대폰번호, 생년월일, 성별
- 선택: 이메일

2. 개인정보의 수집 및 이용목적
...`,
  },
  'terms-third-party': {
    title: '개인정보 제3자 제공 동의',
    content: `귀하의 개인정보는 다음과 같이 제3자에게 제공됩니다.

1. 제공받는 자: 귀하가 소속된 회사
2. 제공 항목: 이름, 휴대폰번호, 출퇴근 기록
...`,
  },
  'terms-location': {
    title: '위치기반서비스 이용 약관',
    content: `제1조 (목적)
이 약관은 위급 상황 시 근로자의 위치 파악 및 안전 확보를 위한
위치기반서비스의 이용조건을 규정합니다.

※ 현재 버전에서는 위치 정보를 수집하지 않습니다.
   향후 안전 기능 확장 시 적용될 예정입니다.
...`,
  },
};
```

#### 4.1.3 네비게이션 타입 추가
```typescript
// types/navigation.ts
TermsDetail: {
  termId: string;
  title: string;
};
```

#### 4.1.4 TermsScreen 수정
- 각 약관 항목에 `onPress` 핸들러 추가
- `navigation.navigate('TermsDetail', { termId, title })` 호출

#### 4.1.5 TermsDetailScreen 구현
- ScrollView로 약관 전체 내용 표시
- 상단에 제목, 하단에 "확인" 버튼

---

### 4.2 기존 회원 로그인 분기

#### 4.2.1 현재 코드 확인
`src/screens/auth/PhoneVerifyScreen.tsx`의 `handleVerify` 함수 확인

#### 4.2.2 Mock 서버 수정
기존 회원 로그인 시나리오 테스트를 위해 Mock 서버에서:
- 특정 전화번호 입력 시 `isRegistered: true` 반환

```javascript
// mock-server/server.js
// 테스트용 기존 회원 번호
const EXISTING_MEMBER_PHONE = '01099999999';

app.post('/auth/verify-sms', (req, res) => {
  const { phoneNumber, code } = req.body;

  if (phoneNumber === EXISTING_MEMBER_PHONE && code === '123456') {
    return res.json({
      verified: true,
      isRegistered: true,
      accessToken: 'mock-token-existing',
      refreshToken: 'mock-refresh-existing',
      workerId: 'worker-existing',
      status: 'ACTIVE',
    });
  }

  // ... 기존 로직
});
```

---

### 4.3 선등록 사용자 Pre-fill

#### 4.3.1 Mock 서버 수정
특정 전화번호에 preRegisteredData 반환

```javascript
const PRE_REGISTERED_PHONE = '01088888888';

app.post('/auth/verify-sms', (req, res) => {
  const { phoneNumber, code } = req.body;

  if (phoneNumber === PRE_REGISTERED_PHONE && code === '123456') {
    return res.json({
      verified: true,
      isRegistered: false,
      preRegisteredData: {
        name: '선등록테스트',
        birthDate: '19900101',
        gender: 'M',
        nationality: '대한민국',
        teamId: 'team-001',
        jobTitle: '전기기사',
      },
    });
  }

  // ... 기존 로직
});
```

#### 4.3.2 WorkerInfoScreen 수정
- `route.params.preRegisteredData` 활용
- 폼 초기값 설정
- 상단 배너 표시 (preRegisteredData가 있을 때)

---

## 5. 테스트 시나리오

### 5.1 약관 상세 페이지
1. 약관 동의 화면에서 각 약관 항목의 `>` 버튼 클릭
2. 상세 페이지로 이동하여 전체 내용 확인
3. "확인" 버튼으로 약관 동의 화면 복귀

### 5.2 기존 회원 로그인
1. 회사코드 입력 (`TEST1234`)
2. 전화번호 입력 (`01099999999` - 기존 회원)
3. 인증번호 입력 (`123456`)
4. **예상 결과**: 회원가입 플로우 건너뛰고 홈 화면으로 이동

### 5.3 선등록 사용자 Pre-fill
1. 회사코드 입력 (`TEST1234`)
2. 전화번호 입력 (`01088888888` - 선등록 회원)
3. 인증번호 입력 (`123456`)
4. **예상 결과**: 정보 입력 화면에서 미리 입력된 데이터 확인
5. 상단에 "관리자가 등록한 정보를 불러왔습니다" 배너 표시

### 5.4 데이터 충돌 처리
1. 선등록 사용자로 진입
2. 이름 또는 생년월일 수정
3. "다음" 클릭
4. **예상 결과**: 충돌 확인 팝업 표시
5. "확인" 선택 시 `isDataConflict: true`로 전송

---

## 6. 파일 변경 요약

### 신규 파일
| 파일 | 설명 |
|------|------|
| `src/screens/auth/TermsDetailScreen.tsx` | 약관 상세 화면 |
| `src/constants/terms.ts` | 약관 내용 상수 |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/types/navigation.ts` | TermsDetail 라우트 추가 |
| `src/navigation/AuthStack.tsx` | TermsDetailScreen 추가 |
| `src/screens/auth/TermsScreen.tsx` | 상세 페이지 이동 핸들러 |
| `src/screens/auth/WorkerInfoScreen.tsx` | Pre-fill 및 충돌 처리 |
| `src/screens/auth/PhoneVerifyScreen.tsx` | 기존 회원 분기 확인 |
| `mock-server/server.js` | 테스트 시나리오 추가 |

---

## 7. 다음 단계

위 기능 구현 완료 후:
1. 실제 기기 테스트
2. GitHub push
3. tongpeople_industry_v1 백엔드 연동 작업 시작
