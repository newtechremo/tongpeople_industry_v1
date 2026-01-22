# Q01 QR 스캔 (QR Scanner)

> **화면 ID**: Q01
> **파일명**: `Q01-qr-scan.md`
> **상태**: Phase 1 MVP

---

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **화면명** | QR 스캔 |
| **영문명** | QR Scanner |
| **접근 조건** | role == 'TEAM_ADMIN' \|\| 'SITE_ADMIN' \|\| 'SUPER_ADMIN' |
| **하단 탭** | QR스캔 (활성) |

---

## 2. 레이아웃 구조

```
┌─────────────────────────────────────┐
│  ←       QR 스캔                    │  ← 헤더
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │                             │   │
│  │     ┌─────────────────┐     │   │
│  │     │                 │     │   │
│  │     │   [카메라 뷰]    │     │   │  ← 카메라 영역
│  │     │                 │     │   │
│  │     │   ╔═══════╗     │     │   │  ← 스캔 프레임
│  │     │   ║       ║     │     │   │
│  │     │   ╚═══════╝     │     │   │
│  │     │                 │     │   │
│  │     └─────────────────┘     │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│      근로자 QR 코드를 스캔해주세요    │  ← 안내 텍스트
│                                     │
│    ┌─────────┐    ┌─────────┐      │
│    │  출근   │    │  퇴근   │      │  ← 스캔 모드 토글
│    └─────────┘    └─────────┘      │
│                                     │
├─────────────────────────────────────┤
│  홈    출퇴근    [QR]     MY       │
└─────────────────────────────────────┘
```

---

## 3. UI 컴포넌트

### 3.1 헤더

```
┌─────────────────────────────────────┐
│  ←       QR 스캔                    │
└─────────────────────────────────────┘

타입: 타이틀 헤더
뒤로가기: 이전 화면 (홈)
제목: "QR 스캔", 18px, Bold, Slate 800
```

### 3.2 카메라 영역

```
┌─────────────────────────────────────┐
│                                     │
│     ╔══════════════════════╗       │
│     ║                      ║       │
│     ║   [카메라 프리뷰]     ║       │
│     ║                      ║       │
│     ║    ┌──────────┐      ║       │
│     ║    │ 스캔영역  │      ║       │  ← 280x280
│     ║    └──────────┘      ║       │
│     ║                      ║       │
│     ╚══════════════════════╝       │
│                                     │
└─────────────────────────────────────┘

카메라: 전체 너비, 높이 flex-1
스캔 프레임: 280x280, 흰색 모서리 (4개 코너)
모서리 두께: 4px
모서리 길이: 32px
배경 오버레이: 반투명 검정 (rgba(0,0,0,0.6))
```

### 3.3 스캔 프레임 디자인

```
     ────┐                 ┌────
         │                 │


         │                 │
     ────┘                 └────

4개 코너: White, 4px 두께, 32px 길이
중앙 스캔 영역: 280x280 투명
```

### 3.4 안내 텍스트

```
   근로자 QR 코드를 스캔해주세요

폰트: 16px, Medium
색상: White (카메라 배경 위)
또는 Slate 600 (카메라 밖)
정렬: 중앙
```

### 3.5 스캔 모드 토글

```
┌─────────────────┬─────────────────┐
│     출근        │      퇴근       │
│   (선택됨)      │    (미선택)     │
└─────────────────┴─────────────────┘

너비: 화면의 80%
높이: 48px
모서리: 24px (pill shape)
선택됨: Orange 500 배경, White 텍스트
미선택: Gray 100 배경, Slate 500 텍스트
폰트: 16px, SemiBold
애니메이션: 슬라이드 전환 (200ms)
```

### 3.6 플래시 토글 버튼 (선택적)

```
      [🔦]

위치: 카메라 영역 우측 상단
크기: 44x44
배경: rgba(0,0,0,0.3)
아이콘: Flashlight, White
모서리: 22px (원형)
```

---

## 4. 권한 분기

### 4.1 TEAM_ADMIN

```
- 자기 팀원의 QR만 스캔 가능
- 다른 팀 근로자 스캔 시 에러
```

### 4.2 SITE_ADMIN / SUPER_ADMIN

```
- 현장 내 모든 근로자 QR 스캔 가능
- 다른 현장 근로자 스캔 시 에러
```

---

## 5. 상태별 UI

### 5.1 카메라 로딩

```
┌─────────────────────────────────────┐
│                                     │
│           카메라 로딩 중...          │
│              ⏳                     │
│                                     │
└─────────────────────────────────────┘
```

### 5.2 카메라 권한 없음

```
┌─────────────────────────────────────┐
│                                     │
│         📷                          │
│                                     │
│   카메라 권한이 필요합니다            │
│                                     │
│   QR 스캔을 위해 카메라 접근을        │
│   허용해주세요.                      │
│                                     │
│   ┌─────────────────────────┐       │
│   │     설정으로 이동        │       │
│   └─────────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

### 5.3 스캔 중

```
- 정상 카메라 화면 표시
- 스캔 프레임 애니메이션 (선택적)
- 레이저 스캔라인 (위아래 이동)
```

### 5.4 스캔 감지됨

```
- QR 감지 시 프레임 색상 변경 (Green)
- 진동 피드백 (Haptic)
- 자동으로 Q02 또는 Q03 화면 전환
```

---

## 6. 인터랙션

### 6.1 모드 전환

```
출근 모드:
  - QR 스캔 → 출근 처리 API
  - 이미 출근한 근로자: 에러 표시

퇴근 모드:
  - QR 스캔 → 퇴근 처리 API
  - 출근 기록 없는 근로자: 에러 표시
```

### 6.2 QR 스캔 성공 플로우

```
1. QR 감지
2. QR 페이로드 파싱
3. 서명 검증
4. 만료 시간 확인 (30초 이내)
5. API 호출 (출근/퇴근)
6. 결과 화면 표시 (Q02/Q03)
```

### 6.3 QR 유효성 검사

```typescript
const validateQR = (payload: QRPayload) => {
  // 1. 서명 검증
  if (!verifySignature(payload)) {
    return { valid: false, error: 'INVALID_SIGNATURE' };
  }

  // 2. 만료 확인 (30초)
  if (Date.now() > payload.expiresAt) {
    return { valid: false, error: 'QR_EXPIRED' };
  }

  // 3. 권한 확인 (팀/현장)
  if (!hasPermission(payload.workerId)) {
    return { valid: false, error: 'NO_PERMISSION' };
  }

  return { valid: true };
};
```

---

## 7. API 연동

### 출근 스캔 Request

```typescript
POST /functions/v1/scan-check-in

{
  "qrPayload": {
    "workerId": "uuid-worker",
    "timestamp": 1736745600000,
    "expiresAt": 1736745630000,
    "signature": "hmac-sha256-hash"
  },
  "scannerUserId": "uuid-scanner"
}
```

### 퇴근 스캔 Request

```typescript
POST /functions/v1/scan-check-out

{
  "qrPayload": {
    "workerId": "uuid-worker",
    "timestamp": 1736745600000,
    "expiresAt": 1736745630000,
    "signature": "hmac-sha256-hash"
  },
  "scannerUserId": "uuid-scanner",
  "attendanceId": "uuid-attendance"  // 출근 기록 ID
}
```

### Response (성공)

```typescript
{
  "success": true,
  "worker": {
    "id": "uuid",
    "name": "홍길동",
    "teamName": "(주)정이앤지",
    "jobTitle": "전기기사"
  },
  "attendance": {
    "id": "uuid",
    "checkInTime": "2026-01-13T09:00:00+09:00",
    "checkOutTime": null  // 출근 시
  }
}
```

### Response (에러)

```typescript
{
  "success": false,
  "error": {
    "code": "ALREADY_CHECKED_IN",  // or "NOT_CHECKED_IN", "QR_EXPIRED", etc.
    "message": "이미 출근한 근로자입니다"
  }
}
```

---

## 8. 에러 처리

| 에러 코드 | 메시지 | 처리 |
|----------|--------|------|
| `QR_EXPIRED` | QR 코드가 만료되었습니다 | Q03 화면 표시 |
| `INVALID_SIGNATURE` | 유효하지 않은 QR 코드입니다 | Q03 화면 표시 |
| `ALREADY_CHECKED_IN` | 이미 출근한 근로자입니다 | Q03 화면 표시 |
| `NOT_CHECKED_IN` | 출근 기록이 없습니다 | Q03 화면 표시 |
| `NO_PERMISSION` | 스캔 권한이 없습니다 | Q03 화면 표시 |
| `WORKER_NOT_FOUND` | 근로자를 찾을 수 없습니다 | Q03 화면 표시 |

---

## 9. 디자인 토큰

```tsx
// 스캔 프레임
const scanFrame = {
  size: 280,
  cornerLength: 32,
  cornerWidth: 4,
  cornerColor: 'white',
};

// 오버레이
const overlay = {
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
};

// 모드 토글
const modeToggle = {
  activeBackground: 'bg-orange-500',
  activeText: 'text-white',
  inactiveBackground: 'bg-gray-100',
  inactiveText: 'text-slate-500',
  height: 48,
  borderRadius: 24,
};

// 스캔라인 애니메이션
const scanlineAnimation = {
  duration: 2000,
  translateY: [0, 260, 0],
  color: 'rgba(249, 115, 22, 0.5)',  // Orange 500 반투명
};
```

---

## 10. Figma 프레임 목록

| 프레임명 | 설명 |
|----------|------|
| `Q01 QR스캔 / Default` | 기본 스캔 화면 (출근 모드) |
| `Q01 QR스캔 / CheckoutMode` | 퇴근 모드 선택됨 |
| `Q01 QR스캔 / Scanning` | QR 감지 중 |
| `Q01 QR스캔 / NoPermission` | 카메라 권한 없음 |
| `Q01 QR스캔 / Loading` | 카메라 로딩 중 |
