# 모바일-PC 관리자 기능 통합 계획서

> **생성일**: 2026-01-15
> **수정일**: 2026-01-15 (Momus 리뷰 반영)
> **상태**: 검토 완료
> **우선순위**: 높음 (기능 연동 필수)

---

## 1. 개요

### 1.1 목적
모바일 앱(worker-mobile)과 PC 관리자(admin-web) 간의 기능 충돌 지점을 해결하고, 안정적인 연동 환경을 구축한다.

### 1.2 현황 요약
| 앱 | 구현률 | 상태 |
|----|--------|------|
| PC 관리자 | 80% | 백엔드 연동 완료, 일부 UI 목업 |
| 모바일 | 20% | UI만 구현, API 미연동 |

### 1.3 핵심 문제
1. **상태값 불일치**: `is_active` (boolean) vs `WorkerStatus` (enum)
2. **QR 보안 취약**: signature 타입 정의 있으나 검증 로직 미구현
3. **모바일 기능 부재**: 로그인, 가입, API 연동, 상태 모니터링 없음
4. **연동 미완성**: PC QR 스캐너, 실시간 동기화 없음

---

## 2. 작업 단계

### Phase 1: DB 스키마 및 타입 정리 (우선순위 1)

#### Task 1.1: WorkerStatus 타입 확장
**현재** (`packages/shared/src/types/index.ts:71`):
```typescript
export type WorkerStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';  // 3개만
```

**수정 필요**:
```typescript
// packages/shared/src/types/index.ts
export type WorkerStatus =
  | 'PENDING'     // 관리자 선등록 후 동의 대기
  | 'REQUESTED'   // 근로자 직접 가입 후 승인 대기
  | 'ACTIVE'      // 활성
  | 'INACTIVE'    // 비활성 (퇴사 등)
  | 'BLOCKED';    // 관리자 차단

export const WORKER_STATUS_LABELS: Record<WorkerStatus, string> = {
  PENDING: '동의 대기',
  REQUESTED: '승인 대기',
  ACTIVE: '정상',
  INACTIVE: '비활성',
  BLOCKED: '차단',
};
```

---

#### Task 1.2: users 테이블 status 필드 추가
```sql
-- 마이그레이션: 20260115_add_user_status.sql

-- 1. 기존 RLS 정책 확인 및 백업
-- SELECT * FROM pg_policies WHERE tablename = 'users';

-- 2. status 필드 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'
CHECK (status IN ('PENDING', 'REQUESTED', 'ACTIVE', 'INACTIVE', 'BLOCKED'));

-- 3. 기존 데이터 마이그레이션
UPDATE users SET status = CASE
  WHEN is_active = true THEN 'ACTIVE'
  WHEN is_active = false THEN 'INACTIVE'
  ELSE 'PENDING'
END
WHERE status IS NULL OR status = 'PENDING';

-- 4. is_active 필드는 당분간 유지 (하위 호환)
-- 추후 마이그레이션에서 제거 예정
```

**롤백 스크립트**:
```sql
-- rollback_20260115_add_user_status.sql
ALTER TABLE users DROP COLUMN IF EXISTS status;
```

**파일 위치**: `backend/supabase/migrations/`

**영향 범위**:
- `apps/admin-web/src/api/workers.ts` - status 필드 사용
- `apps/admin-web/src/pages/WorkersPage.tsx` - 필터링 로직
- `packages/shared/src/types/index.ts` - WorkerStatus 타입

---

#### Task 1.3: RLS 정책 업데이트
```sql
-- 1. 기존 정책 확인
SELECT policyname FROM pg_policies WHERE tablename = 'users';

-- 2. 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "workers_read_own" ON users;
DROP POLICY IF EXISTS "admin_update_status" ON users;

-- 3. 새 정책 생성
-- 근로자는 본인 정보만 조회 가능
CREATE POLICY "workers_read_own" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    role IN ('SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN')
  );

-- 상태 변경은 관리자만
CREATE POLICY "admin_update_status" ON users
  FOR UPDATE USING (
    role IN ('SUPER_ADMIN', 'SITE_ADMIN')
  );
```

---

### Phase 2: 모바일 인증 및 가입 구현 (우선순위 1)

#### Task 2.1: Supabase 클라이언트 설정
```typescript
// apps/worker-mobile/src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**의존성 추가**:
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

---

#### Task 2.2: 인증 컨텍스트
```typescript
// apps/worker-mobile/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { WorkerStatus } from '@tong-pass/shared';

interface AuthState {
  user: User | null;
  status: WorkerStatus;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    status: 'PENDING',
    isLoading: true,
  });

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setState({ user: null, status: 'PENDING', isLoading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      setState({
        user: data,
        status: data.status || 'PENDING',
        isLoading: false,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

#### Task 2.3: 가입 플로우 화면
```
apps/worker-mobile/app/
├── (auth)/
│   ├── _layout.tsx        # 인증 플로우 레이아웃
│   ├── login.tsx          # 로그인 (휴대폰 + 비밀번호)
│   ├── company-code.tsx   # 회사코드 입력
│   ├── signup.tsx         # 정보 입력 (이름, 생년월일, 성별 등)
│   └── verify.tsx         # SMS 인증
├── pending.tsx            # 승인 대기 화면
├── blocked.tsx            # 차단 안내 화면
└── (main)/                # 기존 메인 화면들
    ├── _layout.tsx
    ├── index.tsx          # 홈
    ├── qr.tsx             # QR 생성
    ├── history.tsx        # 출퇴근 기록
    └── profile.tsx        # 프로필
```

**가입 API**:
```typescript
// apps/worker-mobile/src/api/auth.ts
export async function signUp(data: SignUpData) {
  // 1. Supabase Auth 계정 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    phone: data.phone,
    password: data.password,
  });

  if (authError) throw authError;

  // 2. users 테이블에 프로필 생성
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id,
      company_id: data.companyId,
      site_id: data.siteId,
      partner_id: data.teamId,
      name: data.name,
      phone: data.phone,
      birth_date: data.birthDate,
      gender: data.gender,
      nationality: data.nationality,
      role: 'WORKER',
      status: 'REQUESTED',  // 승인 대기 상태
    });

  if (profileError) throw profileError;
  return authData;
}
```

---

#### Task 2.4: 상태 기반 라우팅
```typescript
// apps/worker-mobile/app/_layout.tsx
import { Redirect, Slot } from 'expo-router';
import { useAuth, AuthProvider } from '../src/context/AuthContext';

function RootLayoutNav() {
  const { user, status, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;

  // 미로그인 → 로그인 화면
  if (!user) return <Redirect href="/(auth)/login" />;

  // 승인 대기 → 대기 화면
  if (status === 'PENDING' || status === 'REQUESTED') {
    return <Redirect href="/pending" />;
  }

  // 차단됨 → 차단 안내
  if (status === 'BLOCKED') {
    return <Redirect href="/blocked" />;
  }

  // 비활성 → 비활성 안내
  if (status === 'INACTIVE') {
    return <Redirect href="/inactive" />;
  }

  // 정상 → 메인
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
```

---

### Phase 3: API 연동 (우선순위 1)

#### Task 3.1: API 레이어 구축
```
apps/worker-mobile/src/api/
├── supabase.ts     # (Task 2.1에서 생성)
├── auth.ts         # 로그인/로그아웃/가입
├── user.ts         # 사용자 정보
├── attendance.ts   # 출퇴근 기록
└── index.ts        # 배럴 export
```

---

#### Task 3.2: 출퇴근 기록 조회
```typescript
// apps/worker-mobile/src/api/attendance.ts
import { supabase } from './supabase';
import type { AttendanceRecord } from '@tong-pass/shared';

export async function getMyAttendance(
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .order('work_date', { ascending: false });

  if (error) throw error;
  return data || [];
}
```

---

#### Task 3.3: history.tsx API 연동
```typescript
// apps/worker-mobile/app/history.tsx (수정)
import { useEffect, useState } from 'react';
import { getMyAttendance } from '../src/api/attendance';

export default function HistoryScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
      const startDate = getMonthStart(); // 이번 달 시작
      const endDate = getToday();
      const data = await getMyAttendance(startDate, endDate);
      setRecords(data);
    } catch (error) {
      console.error('출퇴근 기록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // ... 렌더링
}
```

---

### Phase 4: QR 보안 강화 (우선순위 2)

#### Task 4.1: 현황 파악
**QRPayload 타입** (`packages/shared/src/types/index.ts:216-222`):
```typescript
// ✅ signature 필드 이미 정의됨
export interface QRPayload {
  workerId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;  // ← 있음
}
```

**check-in 함수** (`backend/supabase/functions/check-in/index.ts:9-16`):
```typescript
// ❌ signature 검증 없음
interface CheckInRequest {
  qr_payload: {
    workerId: string;
    timestamp: number;
    expiresAt: number;
    // signature 없음!
  };
}
```

---

#### Task 4.2: QR 서명 생성 (모바일)
```typescript
// apps/worker-mobile/src/utils/qrSigner.ts
import * as Crypto from 'expo-crypto';

const QR_SECRET_KEY = process.env.EXPO_PUBLIC_QR_SECRET_KEY!;

export async function generateSignedQR(workerId: string): Promise<QRPayload> {
  const timestamp = Date.now();
  const expiresAt = timestamp + 30000; // 30초

  const payload = { workerId, timestamp, expiresAt };
  const message = JSON.stringify(payload);

  // HMAC-SHA256 서명
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    message + QR_SECRET_KEY
  );

  return { ...payload, signature };
}
```

**의존성 추가**:
```bash
npx expo install expo-crypto
```

---

#### Task 4.3: QR 서명 검증 (백엔드)
```typescript
// backend/supabase/functions/check-in/index.ts (수정)

// 기존 CheckInRequest 인터페이스 수정
interface CheckInRequest {
  site_id: number;
  qr_payload: {
    workerId: string;
    timestamp: number;
    expiresAt: number;
    signature: string;  // 추가
  };
}

// 서명 검증 함수 추가
function verifyQRSignature(payload: CheckInRequest['qr_payload']): boolean {
  const QR_SECRET_KEY = Deno.env.get('QR_SECRET_KEY');
  if (!QR_SECRET_KEY) {
    console.error('QR_SECRET_KEY not configured');
    return false;
  }

  const { workerId, timestamp, expiresAt, signature } = payload;
  const message = JSON.stringify({ workerId, timestamp, expiresAt });

  const encoder = new TextEncoder();
  const key = encoder.encode(QR_SECRET_KEY);
  const data = encoder.encode(message);

  // Deno 방식의 HMAC
  const expectedSig = await crypto.subtle.digest(
    'SHA-256',
    new Uint8Array([...data, ...key])
  );

  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedHex;
}

// 메인 핸들러에서 사용
// 1. QR 유효성 검사 후 추가
if (!verifyQRSignature(qr_payload)) {
  return new Response(
    JSON.stringify({ error: 'QR 코드가 위변조되었습니다.' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

#### Task 4.4: qr.tsx 서명 적용
```typescript
// apps/worker-mobile/app/qr.tsx (수정)
import { useAuth } from '../src/context/AuthContext';
import { generateSignedQR } from '../src/utils/qrSigner';

export default function QRScreen() {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    const generateQR = async () => {
      const payload = await generateSignedQR(user.id);
      setQrData(JSON.stringify(payload));
    };

    generateQR();
    const interval = setInterval(generateQR, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return <QRCode value={qrData} />;
}
```

---

### Phase 5: 실시간 동기화 (우선순위 2)

#### Task 5.1: 상태 변경 모니터링 (모바일)
```typescript
// apps/worker-mobile/src/hooks/useStatusMonitor.ts
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export function useStatusMonitor(userId: string) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;

          if (newStatus === 'BLOCKED') {
            Alert.alert(
              '접근 차단',
              '관리자에 의해 접근이 차단되었습니다.',
              [{ text: '확인', onPress: () => supabase.auth.signOut() }]
            );
          } else if (newStatus === 'ACTIVE') {
            // 승인됨 → 메인으로 이동
            router.replace('/(main)');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
```

---

#### Task 5.2: 대시보드 실시간 갱신 (PC)
```typescript
// apps/admin-web/src/hooks/useRealtimeAttendance.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRealtimeAttendance(siteId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!siteId) return;

    const channel = supabase
      .channel(`attendance-${siteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `site_id=eq.${siteId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['attendance', siteId] });
          queryClient.invalidateQueries({ queryKey: ['dashboard', siteId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId, queryClient]);
}
```

---

### Phase 6: PC QR 스캐너 (우선순위 3)

#### Task 6.1: QR 스캐너 컴포넌트
```typescript
// apps/admin-web/src/components/QRScanner.tsx
import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (payload: QRPayload) => void;
  onError: (message: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: 250 },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        try {
          const payload = JSON.parse(decodedText);
          if (payload.workerId && payload.timestamp && payload.signature) {
            onScan(payload);
          } else {
            onError('잘못된 QR 코드 형식입니다');
          }
        } catch {
          onError('QR 코드를 파싱할 수 없습니다');
        }
      },
      (error) => console.warn('QR 스캔 오류:', error)
    );

    return () => {
      scannerRef.current?.clear();
    };
  }, [onScan, onError]);

  return <div id="qr-reader" className="w-full max-w-md mx-auto" />;
}
```

**의존성 추가**:
```bash
pnpm add html5-qrcode
```

---

#### Task 6.2: 출근 처리 모달
```typescript
// apps/admin-web/src/components/CheckInModal.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { QRScanner } from './QRScanner';
import { checkIn } from '../api/attendance';

export function CheckInModal({ isOpen, onClose }: CheckInModalProps) {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const checkInMutation = useMutation({ mutationFn: checkIn });

  const handleScan = async (payload: QRPayload) => {
    try {
      const result = await checkInMutation.mutateAsync(payload);
      setResult(result);
    } catch (error: any) {
      toast.error(error.message || '출근 처리 실패');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      {!result ? (
        <>
          <h2 className="text-lg font-bold mb-4">QR 출근 스캔</h2>
          <QRScanner
            onScan={handleScan}
            onError={(msg) => toast.error(msg)}
          />
        </>
      ) : (
        <div className="text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold">{result.worker_name}</h2>
          <p className="text-slate-500">출근 완료: {result.check_in_time}</p>
          <button onClick={onClose} className="mt-4 btn-primary">
            확인
          </button>
        </div>
      )}
    </Modal>
  );
}
```

---

## 3. 파일 변경 목록

### 신규 생성

| 경로 | 설명 |
|------|------|
| `backend/supabase/migrations/20260115_add_user_status.sql` | status 필드 마이그레이션 |
| `apps/worker-mobile/src/lib/supabase.ts` | Supabase 클라이언트 |
| `apps/worker-mobile/src/context/AuthContext.tsx` | 인증 컨텍스트 |
| `apps/worker-mobile/src/api/auth.ts` | 인증 API |
| `apps/worker-mobile/src/api/attendance.ts` | 출퇴근 API |
| `apps/worker-mobile/src/utils/qrSigner.ts` | QR 서명 유틸 |
| `apps/worker-mobile/src/hooks/useStatusMonitor.ts` | 상태 모니터링 훅 |
| `apps/worker-mobile/app/(auth)/_layout.tsx` | 인증 레이아웃 |
| `apps/worker-mobile/app/(auth)/login.tsx` | 로그인 화면 |
| `apps/worker-mobile/app/(auth)/company-code.tsx` | 회사코드 입력 |
| `apps/worker-mobile/app/(auth)/signup.tsx` | 가입 정보 입력 |
| `apps/worker-mobile/app/pending.tsx` | 승인 대기 화면 |
| `apps/worker-mobile/app/blocked.tsx` | 차단 안내 화면 |
| `apps/admin-web/src/components/QRScanner.tsx` | QR 스캐너 |
| `apps/admin-web/src/components/CheckInModal.tsx` | 출근 처리 모달 |
| `apps/admin-web/src/hooks/useRealtimeAttendance.ts` | 실시간 갱신 훅 |

### 수정 필요

| 경로 | 변경 내용 |
|------|----------|
| `packages/shared/src/types/index.ts:71` | WorkerStatus에 REQUESTED, BLOCKED 추가 |
| `backend/supabase/functions/check-in/index.ts` | QR signature 검증 추가 |
| `apps/admin-web/src/api/workers.ts` | status 필드 사용 |
| `apps/admin-web/src/pages/WorkersPage.tsx` | status 필터링 (5개 상태) |
| `apps/worker-mobile/app/qr.tsx` | 서명된 QR 생성 |
| `apps/worker-mobile/app/history.tsx` | API 연동 |
| `apps/worker-mobile/app/_layout.tsx` | AuthProvider + 상태 라우팅 |

---

## 4. 의존성 추가

### 모바일 (worker-mobile)
```bash
# Supabase 클라이언트
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

# QR 서명
npx expo install expo-crypto
```

### PC 관리자 (admin-web)
```bash
pnpm add html5-qrcode
```

---

## 5. 환경변수 설정

### 모바일 (.env 또는 app.config.js)
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_QR_SECRET_KEY=랜덤32바이트키
```

```javascript
// app.config.js (또는 eas.json의 env)
export default {
  expo: {
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      qrSecretKey: process.env.EXPO_PUBLIC_QR_SECRET_KEY,
    },
  },
};
```

### 백엔드 (Supabase secrets)
```bash
supabase secrets set QR_SECRET_KEY="동일한_랜덤32바이트키"
```

---

## 6. 테스트 시나리오

### 6.1 가입 플로우
1. 모바일에서 회사코드 입력 → 회사 검증
2. 정보 입력 (이름, 생년월일, 휴대폰 등)
3. SMS 인증
4. 가입 완료 → status: REQUESTED
5. PC에서 근로자 목록 → "승인 대기" 필터 확인
6. PC에서 승인 클릭 → status: ACTIVE
7. 모바일에서 실시간 감지 → 메인 화면 전환

### 6.2 출근 플로우
1. 모바일에서 QR 생성 (signature 포함)
2. PC에서 QR 스캔
3. 서명 검증 성공 → 출근 처리
4. 대시보드 KPI 실시간 갱신 확인

### 6.3 차단 플로우
1. PC에서 근로자 차단 (status: BLOCKED)
2. 모바일 실시간 감지 → Alert 표시 → 강제 로그아웃
3. 재로그인 시도 → 차단 안내 화면

### 6.4 QR 위변조 테스트
1. 유효한 QR 캡처 (JSON 복사)
2. workerId 수정
3. 스캔 시도 → "QR 코드가 위변조되었습니다" 에러

---

## 7. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| QR 비밀키 노출 | 보안 취약 | 환경변수 관리, 주기적 교체 (3개월) |
| Supabase Realtime 연결 끊김 | 동기화 지연 | 재연결 로직, 폴링 폴백 |
| 마이그레이션 실패 | 서비스 중단 | 롤백 스크립트 준비, 테스트 환경 먼저 적용 |
| 모바일 캐시 불일치 | UX 혼란 | 로그인 시 강제 새로고침 |
| 기존 RLS 정책 충돌 | 권한 오류 | DROP POLICY IF EXISTS 사용 |

---

## 8. 완료 기준

- [ ] WorkerStatus 타입 5개 값 모두 정의 (PENDING, REQUESTED, ACTIVE, INACTIVE, BLOCKED)
- [ ] 모바일에서 가입 → PC에서 승인 → 모바일 메인 진입 성공
- [ ] 모바일 QR (서명 포함) → PC 스캔 → 출근 기록 생성 확인
- [ ] PC에서 차단 → 모바일 실시간 로그아웃 확인
- [ ] QR 위변조 시도 → 403 에러 처리 확인
- [ ] 출퇴근 기록 조회 API 연동 확인
