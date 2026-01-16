# 통패스 근로자 앱 API 명세

## 1. 개요

### 1.1 기본 정보

| 항목 | 값 |
|------|------|
| Base URL | `https://{project-id}.supabase.co/functions/v1` |
| 프로토콜 | HTTPS |
| 인증 방식 | Bearer Token (JWT) |
| Content-Type | application/json |

### 1.2 인증 헤더

```
Authorization: Bearer {accessToken}
```

### 1.3 공통 에러 응답

| 상태 코드 | 설명 |
|:--------:|------|
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 401 | 인증 실패 (토큰 만료/유효하지 않음) |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 에러 |

```json
{
  "error": "에러 메시지"
}
```

---

## 2. 인증 API (Auth)

### 2.1 회사코드 검증

회사 코드를 검증하고 회사/현장/팀 정보를 반환합니다.

**Endpoint**
```
POST /functions/v1/verify-company-code
```

**Request Body**
```json
{
  "companyCode": "A1B2C3"  // 6자리 회사코드 (A-Z0-9)
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "(주)통하는사람들",
    "address": "서울특별시 강남구..."
  },
  "sites": [
    {
      "id": 1,
      "name": "경희대학교 학생회관",
      "address": "서울특별시 동대문구 경희대로 26",
      "partners": [
        {
          "id": 1,
          "name": "(주)정이앤지",
          "contact_name": "정철수",
          "contact_phone": "010-1234-5678"
        },
        {
          "id": 2,
          "name": "한국건설(주)",
          "contact_name": "김영희",
          "contact_phone": "010-2345-6789"
        }
      ]
    }
  ]
}
```

**특징**
- 각 현장의 팀(partners) 목록 포함
- 비활성화된 코드는 403 에러 반환
- 프론트엔드에서 선택한 site_id의 partners 필터링

**Error Responses**
| 상태 | 에러 메시지 |
|------|------------|
| 400 | 올바른 회사 코드 형식이 아닙니다. (6자리 영문 대문자 + 숫자) |
| 403 | 비활성화된 회사 코드입니다. 관리자에게 문의해주세요. |
| 404 | 존재하지 않는 회사 코드입니다. |

---

### 2.2 SMS 인증번호 요청

전화번호로 SMS 인증번호를 발송합니다.

**Endpoint**
```
POST /functions/v1/send-sms
```

**Request Body**
```json
{
  "phone": "01012345678",  // 숫자만 (하이픈 없음)
  "purpose": "SIGNUP"      // SIGNUP | LOGIN | PASSWORD_RESET
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "인증코드가 발송되었습니다.",
  "code": "123456",  // 개발 환경에서만 반환
  "expiresIn": 180   // 3분 (초)
}
```

**Error Responses**
| 상태 | 에러 메시지 |
|------|------------|
| 400 | 올바른 휴대폰 번호를 입력해주세요. |
| 400 | 이미 가입된 휴대폰 번호입니다. (SIGNUP 시) |
| 404 | 등록되지 않은 휴대폰 번호입니다. (LOGIN 시) |

---

### 2.3 SMS 인증 확인

입력한 인증번호를 검증합니다.

**Endpoint**
```
POST /functions/v1/verify-sms
```

**Request Body**
```json
{
  "phone": "01012345678",
  "code": "123456",
  "purpose": "SIGNUP"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "인증이 완료되었습니다.",
  "verificationToken": "eyJwaG9uZSI6IjAxMDEyMzQ1Njc4..."  // 10분 유효
}
```

**verificationToken 구조** (Base64 인코딩)
```json
{
  "phone": "01012345678",
  "purpose": "SIGNUP",
  "verifiedAt": 1705392000000,
  "expiresAt": 1705392600000  // 10분 후
}
```

**Error Responses**
| 상태 | 에러 메시지 |
|------|------------|
| 400 | 인증코드가 일치하지 않습니다. (N회 남음) |
| 400 | 인증 시도 횟수를 초과했습니다. 인증코드를 다시 요청해주세요. |
| 400 | 인증코드가 만료되었습니다. 다시 요청해주세요. |
| 404 | 인증 요청을 찾을 수 없습니다. 인증코드를 다시 요청해주세요. |

---

### 2.4 근로자 등록

새 근로자를 등록합니다. (회사코드/QR 가입 방식)

**Endpoint**
```
POST /functions/v1/register-worker
```

**Request Body**
```json
{
  "verificationToken": "eyJwaG9uZSI6IjAxMDEyMzQ1Njc4...",
  "phone": "01012345678",
  "name": "홍길동",
  "birthDate": "19900315",     // YYYYMMDD
  "gender": "M",               // M | F
  "nationality": "KR",         // KR | OTHER
  "jobTitle": "전기기사",
  "companyId": 1,
  "siteId": 1,
  "partnerId": 1,
  "termsAgreed": true,         // 필수
  "privacyAgreed": true,       // 필수
  "thirdPartyAgreed": true,    // 필수
  "locationAgreed": true,      // 필수
  "signatureImage": "data:image/png;base64,..."  // Base64 이미지
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "가입 신청이 완료되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.",
  "data": {
    "userId": "uuid",
    "name": "홍길동",
    "phone": "01012345678",
    "status": "REQUESTED"  // 승인 대기
  }
}
```

**특징**
- 모든 근로자는 `REQUESTED` 상태로 생성됨
- 관리자 승인 후 `ACTIVE` 상태로 변경
- `REJECTED` 상태 사용자는 재가입 가능
- Supabase Auth 자동 생성 (랜덤 비밀번호)

**Error Responses**
| 상태 | 에러 메시지 |
|------|------------|
| 400 | 인증 정보가 일치하지 않습니다. |
| 400 | 인증이 만료되었습니다. 처음부터 다시 진행해주세요. |
| 400 | 이미 가입된 휴대폰 번호입니다. |
| 400 | 모든 필수 약관에 동의해주세요. |
| 404 | 현장 정보를 찾을 수 없습니다. |
| 404 | 팀 정보를 찾을 수 없습니다. |

---

## 3. 근로자 API (Worker)

### 3.1 내 정보 조회

로그인한 근로자의 정보 및 출퇴근 상태를 조회합니다.

**Endpoint**
```
GET /functions/v1/worker-me
```

**Headers**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "홍길동",
      "phone": "01012345678",
      "birthDate": "1990-03-15",
      "gender": "M",
      "nationality": "KR",
      "jobTitle": "전기기사",
      "role": "WORKER",
      "status": "ACTIVE"
    },
    "company": {
      "id": 1,
      "name": "(주)통하는사람들",
      "address": "서울특별시 강남구..."
    },
    "site": {
      "id": 1,
      "name": "경희대학교 학생회관",
      "address": "서울특별시 동대문구...",
      "checkout_policy": "AUTO_8H",
      "auto_hours": 8
    },
    "partner": {
      "id": 1,
      "name": "(주)정이앤지"
    },
    "todayAttendance": {
      "checkInTime": "2026-01-16T08:30:00Z",
      "checkOutTime": null,
      "isAutoOut": false
    },
    "commuteStatus": "WORK_ON"  // WORK_OFF | WORK_ON | WORK_DONE
  }
}
```

**Error Responses**
| 상태 | 에러 메시지 |
|------|------------|
| 401 | 유효하지 않은 인증 토큰입니다. |
| 403 | 가입 승인 대기 중입니다. (status: REQUESTED) |
| 403 | 접근이 차단되었습니다. 관리자에게 문의해주세요. (status: BLOCKED) |
| 404 | 사용자 정보를 찾을 수 없습니다. |

---

### 3.2 출근 (QR 스캔)

QR 코드를 스캔하여 출근을 기록합니다.

**Endpoint**
```
POST /functions/v1/check-in
```

**Request Body**
```json
{
  "site_id": 1,
  "qr_payload": {
    "workerId": "uuid",
    "timestamp": 1705392000000,
    "expiresAt": 1705392030000,  // 30초 후
    "signature": "a1b2c3..."      // HMAC-SHA256 서명
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "홍길동님 출근 처리되었습니다.",
  "data": {
    "worker_name": "홍길동",
    "partner_name": "(주)정이앤지",
    "check_in_time": "2026-01-16T08:30:00Z",
    "check_out_time": "2026-01-16T17:30:00Z",  // AUTO_8H 모드
    "is_auto_out": true,
    "is_senior": false
  }
}
```

**특징**
- QR 코드 30초 유효
- HMAC-SHA256 서명 검증 (위변조 방지)
- AUTO_8H 모드: 자동 퇴근 시간 계산
- 중복 출근 방지

**Error Responses**
| 상태 | 에러 메시지 |
|------|------------|
| 400 | QR 코드가 만료되었습니다. 새로고침 후 다시 시도해주세요. |
| 400 | 이미 출근 처리되었습니다. 퇴근 후 다시 시도해주세요. |
| 403 | QR 코드가 위변조되었습니다. 앱에서 새 QR을 생성해주세요. |
| 403 | 가입 승인 대기 중입니다. 관리자 승인을 기다려주세요. |
| 404 | 사용자를 찾을 수 없습니다. |

---

### 3.3 퇴근 (QR 스캔)

QR 코드를 스캔하여 퇴근을 기록합니다.

**Endpoint**
```
POST /functions/v1/check-out
```

**Request Body**
```json
{
  "site_id": 1,
  "qr_payload": {
    "workerId": "uuid",
    "timestamp": 1705424000000,
    "expiresAt": 1705424030000
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "홍길동님 퇴근 처리되었습니다.",
  "data": {
    "worker_name": "홍길동",
    "check_in_time": "2026-01-16T08:30:00Z",
    "check_out_time": "2026-01-16T18:00:00Z",
    "work_hours": 9.5  // 근무 시간
  }
}
```

**Error Responses**
| 상태 | 에러 메시지 |
|------|------------|
| 400 | QR 코드가 만료되었습니다. |
| 400 | 이미 퇴근 처리되었습니다. |
| 404 | 오늘 출근 기록이 없습니다. |

---

## 4. 타입 정의

### 4.1 Worker

```typescript
interface Worker {
  id: string;              // UUID
  name: string;
  phone: string;           // 01012345678
  birthDate: string;       // YYYY-MM-DD
  gender: 'M' | 'F';
  nationality: 'KR' | 'OTHER';
  jobTitle: string;
  role: 'WORKER';
  status: WorkerStatus;
  companyId: number;
  siteId: number;
  partnerId: number;
}
```

### 4.2 WorkerStatus

```typescript
type WorkerStatus =
  | 'PENDING'     // 동의대기 (관리자 선등록)
  | 'REQUESTED'   // 승인대기 (근로자 직접가입)
  | 'ACTIVE'      // 정상 (사용 가능)
  | 'REJECTED'    // 반려 (재가입 가능)
  | 'INACTIVE'    // 비활성 (퇴사 처리)
  | 'BLOCKED';    // 차단 (접근 불가)
```

### 4.3 CommuteStatus

```typescript
type CommuteStatus =
  | 'WORK_OFF'    // 미출근
  | 'WORK_ON'     // 출근 중
  | 'WORK_DONE';  // 퇴근 완료
```

### 4.4 Company / Site / Partner

```typescript
interface Company {
  id: number;
  name: string;
  address: string | null;
}

interface Site {
  id: number;
  name: string;
  address: string | null;
  checkout_policy: 'AUTO_8H' | 'MANUAL';
  auto_hours: number;
}

interface Partner {
  id: number;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
}
```

### 4.5 QR Payload

```typescript
interface QRPayload {
  workerId: string;      // 근로자 UUID
  timestamp: number;     // 생성 시간 (ms)
  expiresAt: number;     // 만료 시간 (ms, 30초 후)
  signature: string;     // HMAC-SHA256 서명
}
```

---

## 5. QR 코드 생성

### 5.1 클라이언트 생성 로직

```typescript
import * as Crypto from 'expo-crypto';

async function generateSignedQR(
  workerId: string,
  validityMs: number = 30000
): Promise<QRPayload> {
  const timestamp = Date.now();
  const expiresAt = timestamp + validityMs;
  const message = JSON.stringify({ workerId, timestamp, expiresAt });

  // HMAC-SHA256 서명 생성
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    message + QR_SECRET_KEY
  );

  return { workerId, timestamp, expiresAt, signature };
}
```

### 5.2 서버 검증 로직

```typescript
// backend/supabase/functions/check-in/index.ts
async function verifyQRSignature(payload: QRPayload): Promise<boolean> {
  const QR_SECRET_KEY = Deno.env.get('QR_SECRET_KEY');
  const message = JSON.stringify({
    workerId: payload.workerId,
    timestamp: payload.timestamp,
    expiresAt: payload.expiresAt
  });

  const combined = message + QR_SECRET_KEY;
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(combined)
  );

  const expectedSignature = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return payload.signature === expectedSignature;
}
```

---

## 6. API 클라이언트 사용법

### 6.1 기본 사용

```typescript
import {
  verifyCompanyCode,
  sendSms,
  verifySms,
  registerWorker
} from '@/api/auth';
import { getWorkerMe } from '@/api/worker';

// 1. 회사코드 검증
const { company, sites } = await verifyCompanyCode('A1B2C3');

// 2. SMS 인증
await sendSms('01012345678', 'SIGNUP');
const { verificationToken } = await verifySms('01012345678', '123456', 'SIGNUP');

// 3. 근로자 등록
await registerWorker({
  verificationToken,
  phone: '01012345678',
  name: '홍길동',
  birthDate: '19900315',
  gender: 'M',
  nationality: 'KR',
  jobTitle: '전기기사',
  companyId: 1,
  siteId: 1,
  partnerId: 1,
  termsAgreed: true,
  privacyAgreed: true,
  thirdPartyAgreed: true,
  locationAgreed: true,
  signatureImage: 'data:image/png;base64,...'
});

// 4. 내 정보 조회
const me = await getWorkerMe();
```

### 6.2 에러 처리

```typescript
import { AxiosError } from 'axios';

try {
  await verifyCompanyCode('INVALID');
} catch (error) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error;
    console.error('에러:', message);

    switch (error.response?.status) {
      case 400:
        // 잘못된 요청
        break;
      case 404:
        // 회사코드 없음
        break;
      case 403:
        // 비활성화된 코드
        break;
    }
  }
}
```

---

## 7. 환경 변수

```bash
# .env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
QR_SECRET_KEY=your-secret-key-here
```

---

## 8. 관련 문서

- [백엔드 연동 가이드](./BACKEND-INTEGRATION.md)
- [프로젝트 개요](./PROJECT-OVERVIEW.md)
- [기술 아키텍처](./ARCHITECTURE.md)
- [개발 가이드](./DEVELOPMENT.md)
