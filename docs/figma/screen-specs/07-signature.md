# A07 전자서명 (Signature)

> **화면 ID**: A07
> **파일명**: `07-signature.md`
> **상태**: Phase 1 MVP

---

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **화면명** | 전자서명 |
| **영문명** | Electronic Signature |
| **접근 조건** | 약관 동의 완료 |
| **이전 화면** | A06 약관 동의 |
| **다음 화면** | 홈 (ACTIVE) 또는 A08 승인대기 (REQUESTED) |

---

## 2. 레이아웃 구조

```
┌─────────────────────────────────────┐
│  ←       전자서명                   │  ← 헤더
├─────────────────────────────────────┤
│                                     │
│      본인 확인을 위해                │
│      전자서명을 입력해주세요          │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │                             │   │
│  │     (서명 영역)              │   │
│  │                             │   │
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│          서명을 입력해주세요          │  ← 힌트 (서명 없을 때)
│                                     │
│                                     │
│  ┌──────────┐  ┌──────────────┐   │
│  │ 다시 쓰기 │  │   가입 완료   │   │
│  └──────────┘  └──────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 3. UI 컴포넌트

### 3.1 안내 텍스트

| 요소 | 스펙 |
|------|------|
| 텍스트 | "본인 확인을 위해\n전자서명을 입력해주세요" |
| 폰트 | H3 (20px, SemiBold) |
| 정렬 | 좌측 |

### 3.2 서명 캔버스

```
┌─────────────────────────────────────┐
│                                     │
│     ~~~~ 서명 ~~~~                  │
│                                     │
└─────────────────────────────────────┘

너비: 화면 너비 - 32px (좌우 패딩)
높이: 200px
배경: Gray 50
테두리: 2px dashed Gray 300
모서리: 16px

터치 시:
  - 테두리: solid Orange 500
  - 배경: White
```

### 3.3 서명 힌트

| 상태 | 표시 |
|------|------|
| 빈 상태 | "서명을 입력해주세요" (Slate 400, 중앙) |
| 서명 중 | 힌트 숨김 |

### 3.4 다시 쓰기 버튼

```
┌──────────────────┐
│    다시 쓰기      │
└──────────────────┘

타입: Secondary (테두리)
너비: flex-1
높이: 52px
활성화: 서명이 있을 때만
```

### 3.5 가입 완료 버튼

```
┌──────────────────┐
│    가입 완료      │
└──────────────────┘

타입: Primary (Orange Gradient)
너비: flex-1
높이: 52px
활성화: 서명이 있을 때
로딩: "가입 중..." + 스피너
```

---

## 4. 서명 캔버스 상세

### 4.1 터치 인터랙션

```typescript
// 터치 이벤트
onTouchStart: 서명 시작
onTouchMove: 경로 그리기
onTouchEnd: 서명 종료

// 선 스타일
strokeColor: '#1E293B' (Slate 800)
strokeWidth: 3
```

### 4.2 서명 데이터

```typescript
// Base64 이미지로 변환
const getSignatureBase64 = async () => {
  const uri = await signatureRef.current.toDataURL('image/png');
  return uri; // "data:image/png;base64,..."
};
```

---

## 5. 상태별 UI

### 5.1 Empty (빈 상태)

```
- 캔버스: dashed 테두리
- 힌트: "서명을 입력해주세요" 표시
- 다시 쓰기: 비활성 (Gray 200)
- 가입 완료: 비활성 (Gray 200)
```

### 5.2 Signing (서명 중)

```
- 캔버스: solid Orange 테두리, White 배경
- 힌트: 숨김
- 버튼: 상태 유지
```

### 5.3 Signed (서명 완료)

```
- 캔버스: 서명 표시
- 다시 쓰기: 활성
- 가입 완료: 활성 (Orange Gradient)
```

### 5.4 Submitting (제출 중)

```
- 캔버스: 터치 비활성
- 다시 쓰기: 비활성
- 가입 완료: "가입 중..." + 스피너
```

---

## 6. 인터랙션

### 6.1 다시 쓰기

```
1. 확인 팝업: "서명을 다시 입력하시겠습니까?"
2. [확인] 시: 캔버스 초기화
3. [취소] 시: 팝업 닫기
```

### 6.2 가입 완료

```
1. 서명 이미지 Base64 변환
2. API 호출: POST /register-worker
3. 성공 시:
   - 선등록 회원 (ACTIVE): 홈 화면으로 이동
   - 직접가입 (REQUESTED): A08 승인대기로 이동
4. 실패 시: 에러 토스트
```

---

## 7. API 연동

### Request

```typescript
POST /functions/v1/register-worker

{
  "siteId": "uuid-site",
  "teamId": "uuid-team",
  "phoneNumber": "01012345678",
  "name": "홍길동",
  "birthDate": "19850315",
  "email": "hong@email.com",  // 선택
  "gender": "M",
  "nationality": "KR",
  "jobTitle": "전기기사",
  "signatureBase64": "data:image/png;base64,...",
  "termsAgreed": {
    "termsOfService": true,
    "privacyPolicy": true,
    "thirdPartySharing": true,
    "locationService": true
  },
  "isDataConflict": false
}
```

### Response

```typescript
// 선등록 회원 (즉시 ACTIVE)
{
  "success": true,
  "workerId": "uuid-worker",
  "status": "ACTIVE",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}

// 직접가입 (승인대기)
{
  "success": true,
  "workerId": "uuid-worker",
  "status": "REQUESTED",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

## 8. 에러 처리

| 에러 | 메시지 | 처리 |
|------|--------|------|
| `DUPLICATE_PHONE` | 이미 가입된 전화번호입니다 | 로그인 화면 유도 |
| `INVALID_SIGNATURE` | 서명을 다시 입력해주세요 | 캔버스 초기화 |
| `NETWORK_ERROR` | 네트워크 오류가 발생했습니다 | 재시도 버튼 |

---

## 9. 성공 후 처리

### 선등록 회원 (ACTIVE)

```
1. 토스트: "가입이 완료되었습니다!"
2. 토큰 저장
3. 홈 화면으로 이동 (M01~M03)
```

### 직접가입 (REQUESTED)

```
1. 토스트: "가입 요청이 완료되었습니다"
2. 토큰 저장
3. A08 승인대기 화면으로 이동
```

---

## 10. Figma 프레임 목록

| 프레임명 | 설명 |
|----------|------|
| `A07 전자서명 / Empty` | 빈 상태 |
| `A07 전자서명 / Signing` | 서명 중 |
| `A07 전자서명 / Signed` | 서명 완료 |
| `A07 전자서명 / Submitting` | 가입 중 |
| `A07 전자서명 / ClearConfirm` | 다시 쓰기 확인 팝업 |
