# TongPassApp Supabase 백엔드 API 구현 계획서

## 개요

TongPassApp 모바일 앱에서 사용하는 API 엔드포인트를 Supabase로 구현하기 위한 계획서입니다.

**구현 방식**: Supabase Edge Functions (Deno)
**인증**: Supabase Auth + JWT
**데이터베이스**: PostgreSQL (Supabase)

---

## 1. 데이터베이스 스키마

### 1.1 테이블 구조

```sql
-- 회사 테이블
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,  -- 회사코드 (4-10자리)
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 현장 테이블
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  checkout_policy VARCHAR(20) DEFAULT 'AUTO_8H',  -- AUTO_8H, MANUAL
  auto_hours INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팀(협력업체) 테이블
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자(근로자) 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  password_hash TEXT,  -- 비밀번호 해시 (bcrypt)
  name VARCHAR(50) NOT NULL,
  birth_date VARCHAR(8) NOT NULL,  -- YYYYMMDD
  gender VARCHAR(1) NOT NULL,  -- M, F
  email VARCHAR(100),
  nationality VARCHAR(10) DEFAULT 'KR',
  job_title VARCHAR(50),
  role VARCHAR(20) DEFAULT 'WORKER',  -- SUPER_ADMIN, SITE_ADMIN, TEAM_ADMIN, WORKER
  status VARCHAR(20) DEFAULT 'REQUESTED',  -- PENDING, REQUESTED, ACTIVE, INACTIVE, BLOCKED
  is_senior BOOLEAN DEFAULT FALSE,  -- 만 65세 이상
  pre_registered BOOLEAN DEFAULT FALSE,
  signature_url TEXT,
  company_id UUID REFERENCES companies(id),
  site_id UUID REFERENCES sites(id),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS 인증 테이블
CREATE TABLE sms_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL,
  code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) NOT NULL,  -- SIGNUP, PASSWORD_RESET
  verification_token UUID,  -- 인증 성공 시 발급
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 출퇴근 기록 테이블
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id),
  work_date DATE NOT NULL,  -- 근무일 (당일 04:00 ~ 익일 03:59)
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  is_auto_out BOOLEAN DEFAULT FALSE,
  is_senior BOOLEAN DEFAULT FALSE,
  has_accident BOOLEAN DEFAULT FALSE,
  work_duration INTEGER,  -- 근무시간 (분)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, work_date)
);

-- 약관 동의 테이블
CREATE TABLE term_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  term_id VARCHAR(50) NOT NULL,  -- terms, privacy, third_party, location
  agreed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리프레시 토큰 테이블
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_company_site ON users(company_id, site_id);
CREATE INDEX idx_attendances_user_date ON attendances(user_id, work_date);
CREATE INDEX idx_attendances_site_date ON attendances(site_id, work_date);
CREATE INDEX idx_sms_verifications_phone ON sms_verifications(phone, purpose);
```

### 1.2 RLS (Row Level Security) 정책

```sql
-- 사용자는 본인 정보만 조회/수정 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 출퇴근 기록은 본인 것만 조회 가능
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendances" ON attendances
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 2. API 엔드포인트 목록

### 2.1 인증 관련 (Auth)

| 메서드 | 엔드포인트 | 설명 | 우선순위 |
|--------|-----------|------|---------|
| POST | `/verify-company-code` | 회사코드 검증 | P0 |
| POST | `/send-sms` | SMS 인증번호 발송 | P0 |
| POST | `/verify-sms` | SMS 인증 확인 | P0 |
| POST | `/register-worker` | 근로자 등록 | P0 |
| POST | `/auth/login` | 로그인 | P0 |
| POST | `/auth/refresh` | 토큰 갱신 | P0 |
| POST | `/auth/reset-password` | 비밀번호 재설정 | P1 |
| GET | `/auth/worker-status/:id` | 승인 상태 확인 | P0 |

### 2.2 근로자 관련 (Worker)

| 메서드 | 엔드포인트 | 설명 | 우선순위 |
|--------|-----------|------|---------|
| GET | `/worker-me` | 내 정보 조회 | P0 |
| GET | `/worker-qr-payload` | QR 페이로드 생성 | P0 |
| POST | `/worker-commute-in` | 출근 처리 | P0 |
| POST | `/worker-commute-out` | 퇴근 처리 | P0 |
| GET | `/worker-companies` | 참여 회사 목록 | P1 |

### 2.3 조회 관련

| 메서드 | 엔드포인트 | 설명 | 우선순위 |
|--------|-----------|------|---------|
| GET | `/sites/:siteId/teams` | 팀 목록 조회 | P0 |

---

## 3. API 상세 명세

### 3.1 POST `/verify-company-code`

회사코드를 검증하고 해당 회사의 현장 목록을 반환합니다.

**Request:**
```json
{
  "companyCode": "TONG001"
}
```

**Response (200):**
```json
{
  "success": true,
  "company": {
    "id": "uuid",
    "name": "(주)통피플",
    "code": "TONG001",
    "logo": "https://..."
  },
  "sites": [
    {
      "id": "uuid",
      "name": "대전 본사",
      "address": "대전광역시 유성구..."
    }
  ]
}
```

**Error Codes:**
- `INVALID_COMPANY_CODE` - 유효하지 않은 회사코드
- `COMPANY_NOT_FOUND` - 존재하지 않는 회사

**구현 로직:**
```typescript
// supabase/functions/verify-company-code/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { companyCode } = await req.json()

  // 1. 회사코드 검증
  const code = companyCode?.trim()?.toUpperCase()
  if (!code || code.length < 4 || code.length > 10) {
    return new Response(
      JSON.stringify({ error: { code: 'INVALID_COMPANY_CODE', message: '유효하지 않은 회사코드입니다.' }}),
      { status: 400 }
    )
  }

  // 2. 회사 조회
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, code, logo_url')
    .eq('code', code)
    .single()

  if (error || !company) {
    return new Response(
      JSON.stringify({ error: { code: 'COMPANY_NOT_FOUND', message: '존재하지 않는 회사입니다.' }}),
      { status: 404 }
    )
  }

  // 3. 현장 목록 조회
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, address')
    .eq('company_id', company.id)

  return new Response(
    JSON.stringify({
      success: true,
      company: { id: company.id, name: company.name, code: company.code, logo: company.logo_url },
      sites: sites || []
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

### 3.2 POST `/send-sms`

SMS 인증번호를 발송합니다.

**Request:**
```json
{
  "phone": "01012345678",
  "purpose": "SIGNUP"  // SIGNUP, PASSWORD_RESET
}
```

**Response (200):**
```json
{
  "success": true,
  "expiresIn": 180
}
```

**Error Codes:**
- `INVALID_PHONE_NUMBER` - 올바르지 않은 전화번호
- `TOO_MANY_REQUESTS` - 요청 횟수 초과
- `SMS_SEND_FAILED` - SMS 발송 실패
- `USER_NOT_FOUND` - (PASSWORD_RESET 시) 등록되지 않은 사용자

**구현 로직:**
```typescript
// supabase/functions/send-sms/index.ts
serve(async (req) => {
  const { phone, purpose } = await req.json()

  // 1. 전화번호 검증
  const cleanedPhone = phone?.replace(/[^0-9]/g, '')
  if (!cleanedPhone || cleanedPhone.length < 10) {
    return errorResponse('INVALID_PHONE_NUMBER')
  }

  // 2. PASSWORD_RESET인 경우 사용자 존재 확인
  if (purpose === 'PASSWORD_RESET') {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanedPhone)
      .single()

    if (!user) {
      return errorResponse('USER_NOT_FOUND', '등록되지 않은 전화번호입니다.')
    }
  }

  // 3. 기존 인증 요청 확인 (Rate Limiting)
  const { count } = await supabase
    .from('sms_verifications')
    .select('*', { count: 'exact' })
    .eq('phone', cleanedPhone)
    .gte('created_at', new Date(Date.now() - 60000).toISOString())  // 1분 이내

  if (count && count >= 3) {
    return errorResponse('TOO_MANY_REQUESTS')
  }

  // 4. 인증번호 생성 (6자리)
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 180000)  // 3분

  // 5. DB 저장
  await supabase.from('sms_verifications').insert({
    phone: cleanedPhone,
    code,
    purpose,
    expires_at: expiresAt.toISOString()
  })

  // 6. SMS 발송 (외부 서비스 - NHN Cloud, AWS SNS 등)
  await sendSMS(cleanedPhone, `[통패스] 인증번호는 ${code}입니다.`)

  return new Response(
    JSON.stringify({ success: true, expiresIn: 180 }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

### 3.3 POST `/verify-sms`

SMS 인증번호를 확인합니다.

**Request:**
```json
{
  "phone": "01012345678",
  "code": "123456",
  "purpose": "SIGNUP"
}
```

**Response (200) - 신규 회원:**
```json
{
  "success": true,
  "message": "인증이 완료되었습니다.",
  "verificationToken": "uuid",
  "isRegistered": false,
  "preRegisteredData": null
}
```

**Response (200) - 선등록 회원:**
```json
{
  "success": true,
  "message": "인증이 완료되었습니다.",
  "verificationToken": "uuid",
  "isRegistered": false,
  "preRegisteredData": {
    "name": "홍길동",
    "birthDate": "19900101",
    "gender": "M",
    "nationality": "KR",
    "teamId": "uuid",
    "teamName": "생산1팀",
    "jobTitle": "기술자",
    "preRegistered": true
  }
}
```

**Response (200) - 기존 회원 로그인:**
```json
{
  "success": true,
  "message": "로그인 되었습니다.",
  "verificationToken": "uuid",
  "isRegistered": true,
  "accessToken": "jwt...",
  "refreshToken": "uuid",
  "status": "ACTIVE"
}
```

**Error Codes:**
- `INVALID_CODE` - 인증번호 불일치
- `CODE_EXPIRED` - 인증번호 만료

**구현 로직:**
```typescript
serve(async (req) => {
  const { phone, code, purpose } = await req.json()

  // 1. 인증 정보 조회
  const { data: verification } = await supabase
    .from('sms_verifications')
    .select('*')
    .eq('phone', phone)
    .eq('code', code)
    .eq('purpose', purpose)
    .eq('verified', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!verification) {
    // 만료 여부 확인
    const { data: expired } = await supabase
      .from('sms_verifications')
      .select('id')
      .eq('phone', phone)
      .eq('code', code)
      .lt('expires_at', new Date().toISOString())
      .single()

    if (expired) {
      return errorResponse('CODE_EXPIRED')
    }
    return errorResponse('INVALID_CODE')
  }

  // 2. 인증 토큰 생성
  const verificationToken = crypto.randomUUID()

  await supabase
    .from('sms_verifications')
    .update({ verified: true, verification_token: verificationToken })
    .eq('id', verification.id)

  // 3. 기존 회원 확인
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, status, name, birth_date, gender, nationality, team_id, job_title, pre_registered')
    .eq('phone', phone)
    .single()

  if (existingUser) {
    // 기존 회원 - ACTIVE 상태면 로그인 처리
    if (existingUser.status === 'ACTIVE' && purpose === 'SIGNUP') {
      const tokens = await generateTokens(existingUser.id)
      return successResponse({
        verificationToken,
        isRegistered: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        status: existingUser.status
      })
    }

    // 선등록 회원 (PENDING 상태)
    if (existingUser.status === 'PENDING' && existingUser.pre_registered) {
      const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', existingUser.team_id)
        .single()

      return successResponse({
        verificationToken,
        isRegistered: false,
        preRegisteredData: {
          name: existingUser.name,
          birthDate: existingUser.birth_date,
          gender: existingUser.gender,
          nationality: existingUser.nationality,
          teamId: existingUser.team_id,
          teamName: team?.name,
          jobTitle: existingUser.job_title,
          preRegistered: true
        }
      })
    }
  }

  // 4. 신규 회원
  return successResponse({
    verificationToken,
    isRegistered: false,
    preRegisteredData: null
  })
})
```

---

### 3.4 POST `/register-worker`

근로자를 등록합니다.

**Request:**
```json
{
  "phone": "01012345678",
  "name": "홍길동",
  "birthDate": "19900101",
  "gender": "M",
  "email": "test@example.com",
  "nationality": "KR",
  "jobTitle": "기술자",
  "companyId": "uuid",
  "siteId": "uuid",
  "teamId": "uuid",
  "agreedTerms": ["terms", "privacy", "third_party", "location"],
  "signatureImage": "data:image/png;base64,..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "가입 요청이 완료되었습니다.",
  "data": {
    "userId": "uuid",
    "accessToken": "jwt...",
    "refreshToken": "uuid",
    "status": "REQUESTED"
  }
}
```

**Error Codes:**
- `DUPLICATE_PHONE` - 이미 등록된 전화번호
- `INVALID_TEAM` - 유효하지 않은 팀
- `SIGNATURE_REQUIRED` - 서명 필요

**구현 로직:**
```typescript
serve(async (req) => {
  const data = await req.json()

  // 1. 필수 필드 검증
  if (!data.phone || !data.name || !data.birthDate || !data.siteId || !data.teamId) {
    return errorResponse('UNKNOWN_ERROR', '필수 정보가 누락되었습니다.')
  }

  // 2. 서명 검증
  if (!data.signatureImage || data.signatureImage.length < 100) {
    return errorResponse('SIGNATURE_REQUIRED')
  }

  // 3. 중복 체크
  const { data: existing } = await supabase
    .from('users')
    .select('id, status')
    .eq('phone', data.phone)
    .not('status', 'in', '("PENDING")')  // 선등록 제외
    .single()

  if (existing) {
    return errorResponse('DUPLICATE_PHONE')
  }

  // 4. 선등록 사용자 확인
  const { data: preRegistered } = await supabase
    .from('users')
    .select('id')
    .eq('phone', data.phone)
    .eq('status', 'PENDING')
    .eq('pre_registered', true)
    .single()

  // 5. 서명 이미지 업로드
  const signatureUrl = await uploadSignature(data.signatureImage, data.phone)

  // 6. 고령자 여부 계산
  const isSenior = calculateIsSenior(data.birthDate)

  // 7. 사용자 생성/업데이트
  let userId: string
  let status: string

  if (preRegistered) {
    // 선등록 -> ACTIVE (프리패스)
    status = 'ACTIVE'
    await supabase
      .from('users')
      .update({
        name: data.name,
        birth_date: data.birthDate,
        gender: data.gender,
        email: data.email,
        nationality: data.nationality,
        job_title: data.jobTitle,
        is_senior: isSenior,
        signature_url: signatureUrl,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', preRegistered.id)

    userId = preRegistered.id
  } else {
    // 신규 -> REQUESTED (승인 대기)
    status = 'REQUESTED'
    const { data: newUser } = await supabase
      .from('users')
      .insert({
        phone: data.phone,
        name: data.name,
        birth_date: data.birthDate,
        gender: data.gender,
        email: data.email,
        nationality: data.nationality,
        job_title: data.jobTitle,
        company_id: data.companyId,
        site_id: data.siteId,
        team_id: data.teamId,
        is_senior: isSenior,
        signature_url: signatureUrl,
        status
      })
      .select('id')
      .single()

    userId = newUser!.id
  }

  // 8. 약관 동의 저장
  for (const termId of data.agreedTerms) {
    await supabase.from('term_agreements').insert({
      user_id: userId,
      term_id: termId
    })
  }

  // 9. 토큰 발급
  const tokens = await generateTokens(userId)

  return successResponse({
    data: {
      userId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status
    }
  })
})
```

---

### 3.5 GET `/worker-me`

로그인된 근로자의 정보와 오늘 출퇴근 상태를 조회합니다.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "01012345678",
      "name": "홍길동",
      "birthDate": "19900101",
      "isSenior": false,
      "gender": "M",
      "nationality": "KR",
      "jobTitle": "기술자",
      "status": "ACTIVE",
      "role": "WORKER",
      "preRegistered": false,
      "isDataConflict": false,
      "companyId": "uuid",
      "siteId": "uuid",
      "teamId": "uuid",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "company": { "id": "uuid", "name": "(주)통피플" },
    "site": { "id": "uuid", "name": "대전 본사" },
    "partner": { "id": "uuid", "name": "생산1팀" },
    "todayAttendance": {
      "checkInTime": "2024-01-15T09:00:00Z",
      "checkOutTime": null,
      "isAutoOut": false
    },
    "commuteStatus": "WORK_ON"
  }
}
```

**구현 로직:**
```typescript
serve(async (req) => {
  // 1. 토큰 검증
  const userId = await verifyToken(req)
  if (!userId) {
    return errorResponse('INVALID_TOKEN')
  }

  // 2. 사용자 정보 조회
  const { data: user } = await supabase
    .from('users')
    .select(`
      *,
      company:companies(id, name),
      site:sites(id, name),
      team:teams(id, name)
    `)
    .eq('id', userId)
    .single()

  // 3. 오늘 출퇴근 기록 조회
  const workDate = getWorkDate()  // 04:00 기준 근무일 계산
  const { data: attendance } = await supabase
    .from('attendances')
    .select('*')
    .eq('user_id', userId)
    .eq('work_date', workDate)
    .single()

  // 4. 출퇴근 상태 계산
  let commuteStatus = 'WORK_OFF'
  if (attendance) {
    if (attendance.check_out_time) {
      commuteStatus = 'WORK_DONE'
    } else if (attendance.check_in_time) {
      commuteStatus = 'WORK_ON'
    }
  }

  return successResponse({
    data: {
      user: formatUser(user),
      company: user.company,
      site: user.site,
      partner: user.team,
      todayAttendance: attendance ? {
        checkInTime: attendance.check_in_time,
        checkOutTime: attendance.check_out_time,
        isAutoOut: attendance.is_auto_out
      } : null,
      commuteStatus
    }
  })
})
```

---

### 3.6 GET `/worker-qr-payload`

QR 코드에 포함될 서명된 페이로드를 생성합니다.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "workerId": "uuid",
    "timestamp": 1705312800000,
    "expiresAt": 1705312830000,
    "signature": "hmac-sha256-signature",
    "expiresInSeconds": 30
  }
}
```

**구현 로직:**
```typescript
serve(async (req) => {
  const userId = await verifyToken(req)

  const timestamp = Date.now()
  const expiresAt = timestamp + 30000  // 30초

  // HMAC-SHA256 서명 생성
  const payload = `${userId}:${timestamp}:${expiresAt}`
  const signature = await hmacSign(payload, Deno.env.get('QR_SECRET')!)

  return successResponse({
    data: {
      workerId: userId,
      timestamp,
      expiresAt,
      signature,
      expiresInSeconds: 30
    }
  })
})
```

---

### 3.7 POST `/worker-commute-in`

출근 처리를 합니다.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "checkInTime": "2024-01-15T09:00:00Z",
  "commuteStatus": "WORK_ON"
}
```

**Error Codes:**
- `ALREADY_CHECKED_IN` - 이미 출근 처리됨
- `WORKER_NOT_ACTIVE` - 승인되지 않은 계정

**구현 로직:**
```typescript
serve(async (req) => {
  const userId = await verifyToken(req)

  // 1. 사용자 상태 확인
  const { data: user } = await supabase
    .from('users')
    .select('status, site_id, is_senior')
    .eq('id', userId)
    .single()

  if (user.status !== 'ACTIVE') {
    return errorResponse('WORKER_NOT_ACTIVE')
  }

  // 2. 오늘 출퇴근 기록 확인
  const workDate = getWorkDate()
  const { data: existing } = await supabase
    .from('attendances')
    .select('id, check_in_time')
    .eq('user_id', userId)
    .eq('work_date', workDate)
    .single()

  if (existing?.check_in_time) {
    return errorResponse('ALREADY_CHECKED_IN')
  }

  // 3. 출근 기록 생성/업데이트
  const checkInTime = new Date().toISOString()

  if (existing) {
    await supabase
      .from('attendances')
      .update({ check_in_time: checkInTime })
      .eq('id', existing.id)
  } else {
    await supabase.from('attendances').insert({
      user_id: userId,
      site_id: user.site_id,
      work_date: workDate,
      check_in_time: checkInTime,
      is_senior: user.is_senior
    })
  }

  return successResponse({
    checkInTime,
    commuteStatus: 'WORK_ON'
  })
})
```

---

### 3.8 POST `/worker-commute-out`

퇴근 처리를 합니다.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "checkOutTime": "2024-01-15T18:00:00Z",
  "workDuration": 540,
  "commuteStatus": "WORK_DONE"
}
```

**Error Codes:**
- `NOT_CHECKED_IN` - 출근 기록 없음
- `ALREADY_CHECKED_OUT` - 이미 퇴근 처리됨

---

### 3.9 GET `/sites/:siteId/teams`

현장의 팀(협력업체) 목록을 조회합니다.

**Response (200):**
```json
[
  { "id": "uuid", "name": "생산1팀", "siteId": "uuid" },
  { "id": "uuid", "name": "협력업체A", "siteId": "uuid" }
]
```

---

### 3.10 GET `/worker-companies`

로그인된 근로자가 참여한 회사 목록을 조회합니다.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "(주)통피플",
      "code": "TONG001",
      "logo": "https://...",
      "site": {
        "id": "uuid",
        "name": "대전 본사",
        "address": "대전광역시 유성구..."
      },
      "joinedAt": "2024-01-15T00:00:00Z",
      "role": "WORKER"
    }
  ]
}
```

---

## 4. 공통 유틸리티

### 4.1 토큰 생성/검증

```typescript
// utils/auth.ts
import * as jwt from "https://deno.land/x/djwt@v2.8/mod.ts"

const JWT_SECRET = Deno.env.get('JWT_SECRET')!
const ACCESS_TOKEN_EXPIRES = 60 * 60  // 1시간
const REFRESH_TOKEN_EXPIRES = 60 * 60 * 24 * 30  // 30일

export async function generateTokens(userId: string) {
  const accessToken = await jwt.create(
    { alg: "HS256", typ: "JWT" },
    { sub: userId, exp: jwt.getNumericDate(ACCESS_TOKEN_EXPIRES) },
    JWT_SECRET
  )

  const refreshToken = crypto.randomUUID()

  // DB에 리프레시 토큰 저장
  await supabase.from('refresh_tokens').insert({
    user_id: userId,
    token: refreshToken,
    expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES * 1000).toISOString()
  })

  return { accessToken, refreshToken }
}

export async function verifyToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  try {
    const payload = await jwt.verify(token, JWT_SECRET)
    return payload.sub as string
  } catch {
    return null
  }
}
```

### 4.2 근무일 계산

```typescript
// utils/date.ts
export function getWorkDate(): string {
  const now = new Date()
  const hour = now.getHours()

  // 04:00 이전이면 전날이 근무일
  if (hour < 4) {
    now.setDate(now.getDate() - 1)
  }

  return now.toISOString().split('T')[0]
}
```

### 4.3 고령자 계산

```typescript
// utils/senior.ts
export function calculateIsSenior(birthDate: string): boolean {
  const birth = new Date(
    parseInt(birthDate.slice(0, 4)),
    parseInt(birthDate.slice(4, 6)) - 1,
    parseInt(birthDate.slice(6, 8))
  )

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age >= 65
}
```

---

## 5. Supabase Realtime 설정

### 5.1 사용자 상태 변경 구독

```sql
-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE attendances;
```

### 5.2 클라이언트 구독 예시

```typescript
// 사용자 상태 변경 감지 (승인/차단)
const channel = supabase
  .channel(`user-${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'users',
      filter: `id=eq.${userId}`,
    },
    (payload) => {
      const newStatus = payload.new.status
      if (newStatus === 'ACTIVE') {
        // 승인됨 -> 메인 화면으로 전환
      } else if (newStatus === 'BLOCKED') {
        // 차단됨 -> 로그아웃 처리
      }
    }
  )
  .subscribe()
```

---

## 6. 배포 체크리스트

### 6.1 환경 변수

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=your-jwt-secret-key
QR_SECRET=your-qr-signing-secret
SMS_API_KEY=your-sms-api-key  # NHN Cloud, AWS SNS 등
```

### 6.2 배포 순서

1. **데이터베이스 마이그레이션**
   - 테이블 생성
   - 인덱스 생성
   - RLS 정책 설정

2. **Edge Functions 배포**
   ```bash
   supabase functions deploy verify-company-code
   supabase functions deploy send-sms
   supabase functions deploy verify-sms
   supabase functions deploy register-worker
   supabase functions deploy worker-me
   supabase functions deploy worker-qr-payload
   supabase functions deploy worker-commute-in
   supabase functions deploy worker-commute-out
   supabase functions deploy sites-teams
   supabase functions deploy worker-companies
   supabase functions deploy auth-login
   supabase functions deploy auth-refresh
   supabase functions deploy auth-reset-password
   supabase functions deploy auth-worker-status
   ```

3. **Realtime 설정**
   - Publication에 테이블 추가

4. **테스트**
   - 각 API 엔드포인트 테스트
   - 인증 플로우 테스트
   - Realtime 연동 테스트

---

## 7. 우선순위별 구현 계획

### Phase 1 (P0) - 핵심 기능
1. `verify-company-code`
2. `send-sms`
3. `verify-sms`
4. `register-worker`
5. `worker-me`
6. `worker-qr-payload`
7. `worker-commute-in`
8. `worker-commute-out`
9. `sites-teams`
10. `auth-login`
11. `auth-refresh`
12. `auth-worker-status`

### Phase 2 (P1) - 부가 기능
1. `auth-reset-password`
2. `worker-companies`

### Phase 3 - 고도화
1. Realtime 연동
2. 푸시 알림 연동
3. 오프라인 지원

---

## 8. 참고 자료

- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [Supabase Realtime 문서](https://supabase.com/docs/guides/realtime)
- [JWT 인증 가이드](https://supabase.com/docs/guides/auth/jwts)
