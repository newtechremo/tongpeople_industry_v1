# A08 승인 대기 (Waiting Approval)

> **화면 ID**: A08
> **파일명**: `A08-waiting-approval.md`
> **상태**: Phase 1 MVP

---

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **화면명** | 승인 대기 |
| **영문명** | Waiting for Approval |
| **접근 조건** | status == 'REQUESTED' |
| **이전 화면** | A07 전자서명 |
| **다음 화면** | 홈 (관리자 승인 후) |

---

## 2. 레이아웃 구조

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│              ⏳                     │  ← 아이콘 (64px)
│                                     │
│       가입 요청이 완료되었습니다       │
│                                     │
│      관리자 승인 후 이용 가능합니다    │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      내 정보 요약            │   │
│  │  ─────────────────────────── │   │
│  │  이름:     홍길동             │   │
│  │  연락처:   010-1234-5678     │   │
│  │  소속팀:   (주)정이앤지       │   │
│  │  직책:     전기기사           │   │
│  └─────────────────────────────┘   │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        상태 새로고침          │   │
│  └─────────────────────────────┘   │
│                                     │
│            문의: 1588-0000          │
│                                     │
└─────────────────────────────────────┘
```

---

## 3. UI 컴포넌트

### 3.1 상태 아이콘

```
       ⏳

아이콘: Clock 또는 Hourglass
크기: 64x64
색상: Orange 500
애니메이션: 선택적 (부드러운 펄스)
```

### 3.2 메인 메시지

| 요소 | 스펙 |
|------|------|
| 제목 | "가입 요청이 완료되었습니다" |
| 폰트 | H2 (24px, Bold) |
| 색상 | Slate 800 |
| 정렬 | 중앙 |

### 3.3 서브 메시지

| 요소 | 스펙 |
|------|------|
| 텍스트 | "관리자 승인 후 이용 가능합니다" |
| 폰트 | Body L (16px) |
| 색상 | Slate 500 |
| 정렬 | 중앙 |

### 3.4 내 정보 요약 카드

```
┌─────────────────────────────────────┐
│       내 정보 요약                   │  ← 14px, Bold, Slate 500
│  ──────────────────────────────────  │
│  이름       홍길동                   │
│  연락처     010-1234-5678           │
│  소속팀     (주)정이앤지             │
│  직책       전기기사                 │
└─────────────────────────────────────┘

배경: White
테두리: 1px Gray 200
모서리: 16px
패딩: 20px
라벨: Slate 500, 14px
값: Slate 800, 14px, Medium
행 간격: 12px
```

### 3.5 상태 새로고침 버튼

```
┌─────────────────────────────────────┐
│  🔄  상태 새로고침                    │
└─────────────────────────────────────┘

타입: Secondary (테두리)
아이콘: RefreshCw (20px)
텍스트: "상태 새로고침"
로딩 시: 스피너 + "확인 중..."
```

### 3.6 문의 안내

```
문의: 1588-0000

색상: Slate 400
폰트: 14px
터치 시: 전화 연결
```

---

## 4. 특수 동작

### 4.1 Blocking 화면

```
- 뒤로가기 버튼 없음
- 시스템 뒤로가기 무시
- 앱 재시작 시에도 이 화면으로 돌아옴 (status == REQUESTED)
```

### 4.2 상태 확인

```typescript
// 새로고침 버튼 클릭 시
const checkApprovalStatus = async () => {
  const response = await api.get('/worker-me');

  if (response.status === 'ACTIVE') {
    // 승인됨: 홈 화면으로 이동
    router.replace('/');
  } else if (response.status === 'REJECTED') {
    // 반려됨: 반려 안내 표시
    showRejectedModal();
  } else {
    // 아직 승인대기
    showToast('아직 승인 대기 중입니다');
  }
};
```

### 4.3 실시간 업데이트 (Realtime)

```typescript
// Supabase Realtime 구독 (선택적)
useEffect(() => {
  const channel = supabase
    .channel(`user-${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'users',
      filter: `id=eq.${userId}`
    }, (payload) => {
      if (payload.new.status === 'ACTIVE') {
        router.replace('/');
      }
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

---

## 5. 상태별 UI

### 5.1 Waiting (대기 중)

```
- 기본 화면 표시
- 새로고침 버튼 활성
```

### 5.2 Checking (확인 중)

```
- 새로고침 버튼: 로딩 스피너 + "확인 중..."
- 다른 요소 터치 비활성
```

### 5.3 Approved (승인됨)

```
- 토스트: "승인이 완료되었습니다!"
- 홈 화면으로 자동 이동
```

### 5.4 Rejected (반려됨)

```
모달 표시:
┌─────────────────────────────────────┐
│                                     │
│              ✕                     │
│                                     │
│      가입이 반려되었습니다            │
│                                     │
│   사유: 정보가 일치하지 않습니다      │
│                                     │
│   관리자에게 문의해주세요            │
│                                     │
│        [ 확인 ]                     │
│                                     │
└─────────────────────────────────────┘

[확인] 클릭 시: 앱 초기화, A01로 이동
```

---

## 6. 데이터

### 표시 데이터

```typescript
interface WaitingApprovalData {
  name: string;
  phoneNumber: string;
  teamName: string;
  jobTitle: string;
  requestedAt: string;
}
```

### API 응답

```typescript
// GET /worker-me
{
  "id": "uuid",
  "name": "홍길동",
  "status": "REQUESTED",  // or "ACTIVE", "REJECTED"
  "rejectReason": null    // 반려 시 사유
}
```

---

## 7. 에러 처리

| 에러 | 처리 |
|------|------|
| 네트워크 오류 | 토스트 + 재시도 유도 |
| 토큰 만료 | 로그인 화면으로 이동 |

---

## 8. 디자인 토큰

```tsx
// 아이콘 애니메이션 (선택적)
const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1],
  duration: 2000,
  repeat: Infinity,
};

// 카드 스타일
const infoCard = {
  backgroundColor: 'white',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB', // gray-200
  padding: 20,
};
```

---

## 9. Figma 프레임 목록

| 프레임명 | 설명 |
|----------|------|
| `A08 승인대기 / Default` | 기본 대기 상태 |
| `A08 승인대기 / Checking` | 상태 확인 중 |
| `A08 승인대기 / Rejected` | 반려 모달 |
