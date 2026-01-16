# 통패스 근로자 앱 API 명세

## 1. 개요

### 1.1 기본 정보

| 항목 | 값 |
|------|------|
| Base URL | `API_BASE_URL` (환경변수) |
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
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

---

## 2. 인증 API (Auth)

### 2.1 회사코드 검증

회사 고유 코드를 검증하고 회사/현장 정보를 반환합니다.

**Endpoint**
```
POST /verify-company-code
```

**Request Body**
```json
{
  "companyCode": "string"  // 4~10자리 회사코드
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "company": {
    "id": "string",
    "name": "string",
    "code": "string",
    "logo": "string | null"
  },
  "sites": [
    {
      "id": "string",
      "name": "string",
      "address": "string",
      "companyId": "string"
    }
  ]
}
```

**Error Codes**
| 코드 | 설명 |
|------|------|
| `INVALID_COMPANY_CODE` | 유효하지 않은 회사코드 |
| `COMPANY_NOT_FOUND` | 회사를 찾을 수 없음 |

---

### 2.2 SMS 인증번호 요청

전화번호로 SMS 인증번호를 발송합니다.

**Endpoint**
```
POST /request-sms
```

**Request Body**
```json
{
  "phoneNumber": "string"  // 01012345678 형식
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "expiresIn": 180  // 인증번호 유효시간 (초)
}
```

**Error Codes**
| 코드 | 설명 |
|------|------|
| `INVALID_PHONE_NUMBER` | 유효하지 않은 전화번호 |
| `SMS_SEND_FAILED` | SMS 발송 실패 |
| `TOO_MANY_REQUESTS` | 요청 횟수 초과 |

---

### 2.3 SMS 인증 확인

입력한 인증번호를 검증합니다.

**Endpoint**
```
POST /verify-sms
```

**Request Body**
```json
{
  "phoneNumber": "string",
  "code": "string"  // 6자리 인증번호
}
```

**Response (200 OK)**
```json
{
  "verified": true,
  "isRegistered": false,
  "preRegisteredData": {
    "name": "string",
    "birthDate": "string",
    "gender": "M" | "F",
    "nationality": "string",
    "teamId": "string",
    "jobTitle": "string",
    "preRegistered": true
  } | null,
  "accessToken": "string | null"  // 기존 회원인 경우
}
```

**응답 시나리오**

| isRegistered | preRegisteredData | 설명 |
|:------------:|:-----------------:|------|
| `true` | - | 기존 회원, accessToken 발급 |
| `false` | `null` | 신규 회원, 정보 입력 필요 |
| `false` | `{...}` | 선등록 회원, 정보 확인만 필요 |

**Error Codes**
| 코드 | 설명 |
|------|------|
| `INVALID_CODE` | 잘못된 인증번호 |
| `CODE_EXPIRED` | 인증번호 만료 |

---

### 2.4 팀 목록 조회

현장에 소속된 팀 목록을 조회합니다.

**Endpoint**
```
GET /sites/{siteId}/teams
```

**Path Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| siteId | string | 현장 ID |

**Response (200 OK)**
```json
[
  {
    "id": "string",
    "name": "string",
    "siteId": "string"
  }
]
```

---

### 2.5 근로자 등록

새 근로자를 등록합니다.

**Endpoint**
```
POST /register-worker
```

**Request Body**
```json
{
  "siteId": "string",
  "teamId": "string",
  "phoneNumber": "string",
  "name": "string",
  "birthDate": "string",      // YYYYMMDD 형식
  "email": "string | null",   // 선택
  "gender": "M" | "F",
  "nationality": "string",
  "jobTitle": "string",
  "signatureBase64": "string",  // Base64 인코딩된 서명 이미지
  "isDataConflict": false       // 선등록 데이터와 입력 데이터 불일치 여부
}
```

**Response (200 OK)**
```json
{
  "workerId": "string",
  "status": "ACTIVE" | "REQUESTED",
  "accessToken": "string",
  "refreshToken": "string"
}
```

**응답 시나리오**

| status | 설명 |
|--------|------|
| `ACTIVE` | 즉시 승인 (자동 승인 설정) |
| `REQUESTED` | 관리자 승인 대기 |

**Error Codes**
| 코드 | 설명 |
|------|------|
| `DUPLICATE_PHONE` | 이미 등록된 전화번호 |
| `INVALID_TEAM` | 유효하지 않은 팀 ID |
| `SIGNATURE_REQUIRED` | 서명이 필요함 |

---

## 3. 근로자 API (Worker)

### 3.1 내 정보 조회

로그인한 근로자의 정보를 조회합니다.

**Endpoint**
```
GET /worker-me
```

**Headers**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK)**
```json
{
  "id": "string",
  "phoneNumber": "string",
  "name": "string",
  "birthDate": "string",
  "isSenior": true | false,
  "gender": "M" | "F",
  "nationality": "string",
  "jobTitle": "string",
  "status": "PENDING" | "REQUESTED" | "ACTIVE" | "INACTIVE" | "BLOCKED",
  "signatureUrl": "string | null",
  "companyId": "string",
  "siteId": "string",
  "teamId": "string",
  "commuteStatus": "WORK_OFF" | "WORK_ON" | "WORK_DONE"
}
```

---

### 3.2 출근

출근을 기록합니다.

**Endpoint**
```
POST /commute-in
```

**Headers**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK)**
```json
{
  "success": true,
  "checkInTime": "2025-01-15T09:00:00.000Z"
}
```

**Error Codes**
| 코드 | 설명 |
|------|------|
| `ALREADY_CHECKED_IN` | 이미 출근 상태 |
| `WORKER_NOT_ACTIVE` | 비활성 근로자 |

---

### 3.3 퇴근

퇴근을 기록합니다.

**Endpoint**
```
POST /commute-out
```

**Headers**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK)**
```json
{
  "success": true,
  "checkOutTime": "2025-01-15T18:00:00.000Z",
  "workDuration": 540  // 근무시간 (분)
}
```

**Error Codes**
| 코드 | 설명 |
|------|------|
| `NOT_CHECKED_IN` | 출근 기록 없음 |
| `ALREADY_CHECKED_OUT` | 이미 퇴근 상태 |

---

## 4. 토큰 API

### 4.1 토큰 갱신

만료된 accessToken을 갱신합니다.

**Endpoint**
```
POST /refresh-token
```

**Request Body**
```json
{
  "refreshToken": "string"
}
```

**Response (200 OK)**
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

**Error Codes**
| 코드 | 설명 |
|------|------|
| `INVALID_REFRESH_TOKEN` | 유효하지 않은 리프레시 토큰 |
| `REFRESH_TOKEN_EXPIRED` | 리프레시 토큰 만료 |

---

## 5. 타입 정의

### 5.1 Worker

```typescript
interface Worker {
  id: string;
  phoneNumber: string;
  name: string;
  birthDate: string;       // YYYYMMDD
  isSenior: boolean;       // 만 65세 이상
  gender: 'M' | 'F';
  nationality: string;
  jobTitle: string;
  status: WorkerStatus;
  signatureUrl?: string;
  companyId: string;
  siteId: string;
  teamId: string;
}
```

### 5.2 WorkerStatus

```typescript
type WorkerStatus =
  | 'PENDING'     // 대기 (초기 상태)
  | 'REQUESTED'   // 가입 요청됨 (승인 대기)
  | 'ACTIVE'      // 활성 (사용 가능)
  | 'INACTIVE'    // 비활성 (일시 정지)
  | 'BLOCKED';    // 차단됨
```

### 5.3 CommuteStatus

```typescript
type CommuteStatus =
  | 'WORK_OFF'    // 미출근
  | 'WORK_ON'     // 출근 중
  | 'WORK_DONE';  // 퇴근 완료
```

### 5.4 Company / Site / Team

```typescript
interface Company {
  id: string;
  name: string;
  code: string;
  logo?: string;
}

interface Site {
  id: string;
  name: string;
  address: string;
  companyId: string;
}

interface Team {
  id: string;
  name: string;
  siteId: string;
}
```

### 5.5 PreRegisteredData

```typescript
interface PreRegisteredData {
  name: string;
  birthDate: string;
  gender: 'M' | 'F';
  nationality: string;
  teamId: string;
  jobTitle: string;
  preRegistered: true;
}
```

---

## 6. API 클라이언트 사용법

### 6.1 기본 사용

```typescript
import { verifyCompanyCode, requestSmsCode, verifySms } from '@/api/auth';
import { getWorkerMe, commuteIn, commuteOut } from '@/api/worker';

// 회사코드 검증
const result = await verifyCompanyCode('ABCD1234');

// SMS 인증
await requestSmsCode('01012345678');
const verifyResult = await verifySms('01012345678', '123456');

// 출퇴근
await commuteIn();
await commuteOut();
```

### 6.2 에러 처리

```typescript
import { AxiosError } from 'axios';

try {
  await commuteIn();
} catch (error) {
  if (error instanceof AxiosError) {
    const errorCode = error.response?.data?.error?.code;

    switch (errorCode) {
      case 'ALREADY_CHECKED_IN':
        // 이미 출근 상태
        break;
      case 'WORKER_NOT_ACTIVE':
        // 비활성 근로자
        break;
      default:
        // 기타 에러
    }
  }
}
```

---

## 7. 관련 문서

- [프로젝트 개요](./PROJECT-OVERVIEW.md)
- [기술 아키텍처](./ARCHITECTURE.md)
- [개발 가이드](./DEVELOPMENT.md)
