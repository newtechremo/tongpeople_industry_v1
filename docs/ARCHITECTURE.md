# 통패스 기술 아키텍처

> **문서 범례**: ✅ 구현 완료 | 🚧 진행 중 | ⏳ 미구현 (Phase 1 목표)

## 구현 현황 요약

| 영역 | 상태 | 설명 |
|------|:----:|------|
| **프론트엔드 UI** | ✅ | 레이아웃, 페이지, 컴포넌트 |
| **공유 패키지** | ✅ | 타입, 상수, 유틸 함수 |
| **DB 스키마** | ✅ | 테이블, RLS 정책, 함수 |
| **Supabase 클라이언트** | ⏳ | lib/supabase.ts |
| **API 추상화 레이어** | ⏳ | api/*.ts |
| **인증 (Auth)** | ⏳ | AuthContext, ProtectedRoute |
| **React Query 연동** | ⏳ | 커스텀 훅 (useWorkers 등) |
| **Realtime 구독** | ⏳ | 대시보드 실시간 업데이트 |
| **Edge Functions** | ⏳ | check-in, check-out 로직 |

---

## 1. 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트                               │
├─────────────────────────────┬───────────────────────────────────┤
│     관리자 웹 (admin-web)     │    근로자 앱 (worker-mobile)        │
│     React + Vite            │    React Native + Expo            │
│     localhost:5173          │    iOS / Android                  │
└─────────────────────────────┴───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase 백엔드                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │  Database   │  │    Edge Functions       │  │
│  │  (인증/권한)  │  │ (PostgreSQL)│  │  (출퇴근 처리 API)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │   Storage   │  │  Realtime   │                               │
│  │  (파일 저장)  │  │ (실시간 동기화)│                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 기술 스택 결정 배경

### 2.1 왜 Supabase인가?

| 고려사항 | Supabase 선택 이유 |
|----------|-------------------|
| **개발 방식** | AI로 개발 → 보일러플레이트 최소화 필요 |
| **팀 규모** | 개발자 없음 → 인프라 관리 부담 최소화 |
| **MVP 속도** | 빠른 출시 필요 → BaaS로 백엔드 즉시 사용 |
| **실시간 기능** | 대시보드 실시간 업데이트 → Supabase Realtime 내장 |
| **비용** | 50인 x 10개 업체 → Pro 플랜 ($25/월) 충분 |

### 2.2 향후 전환 가능성

```
현재: Supabase + PostgreSQL
  ↓ (필요시)
미래: NestJS + MySQL + Redis (기존 현장통 스택)

전환 준비:
✅ PostgreSQL 전용 기능 최소화
✅ 비즈니스 로직은 코드에서 처리
✅ API 호출 추상화 레이어 유지
```

---

## 3. 모노레포 구조

```
tong-pass/
├── pnpm-workspace.yaml       # 워크스페이스 설정
├── package.json              # 루트 스크립트
├── CLAUDE.md                 # 개발 가이드
│
├── apps/
│   ├── admin-web/            # 관리자 웹 (React)
│   └── worker-mobile/        # 근로자 앱 (React Native)
│
├── packages/
│   └── shared/               # 공유 패키지
│       ├── types/            # TypeScript 타입
│       ├── constants/        # 공통 상수
│       └── utils/            # 유틸 함수
│
├── backend/
│   ├── supabase/             # Supabase 설정
│   │   ├── config.toml       # 로컬 개발 설정
│   │   ├── migrations/       # DB 마이그레이션
│   │   └── seed/             # 테스트 데이터
│   └── functions/            # Edge Functions
│
└── docs/                     # 프로젝트 문서
```

---

## 4. 기술 스택

### 4.1 백엔드 (Supabase)

| 서비스 | 용도 | 비고 |
|--------|------|------|
| **Supabase Auth** | 사용자 인증 | JWT, 소셜 로그인 |
| **Supabase Database** | PostgreSQL DB | RLS 기반 권한 제어 |
| **Supabase Realtime** | 실시간 동기화 | WebSocket |
| **Supabase Storage** | 파일 저장 | 프로필 이미지 등 |
| **Supabase Edge Functions** | 서버리스 API | Deno 런타임 |

### 4.2 관리자 웹 (admin-web)

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | React | 19.x | UI 라이브러리 |
| 빌드 도구 | Vite | 6.x | 번들링, 개발 서버 |
| 언어 | TypeScript | 5.x | 타입 안정성 |
| 스타일링 | Tailwind CSS | 3.x | 유틸리티 CSS |
| 라우팅 | React Router DOM | 7.x | SPA 라우팅 |
| 상태 관리 | TanStack Query | 5.x | 서버 상태 관리 |
| 차트 | Recharts | 2.x | 대시보드 차트 |
| 아이콘 | Lucide React | 0.x | 아이콘 세트 |
| 날짜 | date-fns | 4.x | 날짜 처리 |
| Supabase | @supabase/supabase-js | 2.x | Supabase 클라이언트 |

### 4.3 근로자 모바일 (worker-mobile)

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| 프레임워크 | React Native | 0.76.x | 크로스플랫폼 앱 |
| 개발 도구 | Expo | ~52.x | 개발/배포 |
| 라우팅 | Expo Router | ~4.x | 파일 기반 라우팅 |
| 스타일링 | NativeWind | 4.x | Tailwind for RN |
| QR 생성 | react-native-qrcode-svg | 6.x | QR 코드 렌더링 |
| 카메라 | expo-camera | ~16.x | QR 스캔 |
| Supabase | @supabase/supabase-js | 2.x | Supabase 클라이언트 |

### 4.4 공유 패키지 (@tong-pass/shared)

```typescript
// 타입 사용 예시
import { Worker, Site, UserRole } from '@tong-pass/shared';

// 상수 사용 예시
import { SENIOR_AGE_THRESHOLD } from '@tong-pass/shared/constants';

// 유틸 사용 예시
import { calculateAge, isSenior } from '@tong-pass/shared/utils';
```

---

## 5. 관리자 웹 아키텍처

### 5.1 디렉토리 구조

> ✅ = 구현됨, ⏳ = 미구현 (Phase 1 목표)

```
apps/admin-web/src/
├── main.tsx              # ✅ 앱 진입점
├── App.tsx               # ✅ 라우팅 정의
├── vite-env.d.ts         # ✅ Vite 타입
│
├── lib/                  # ⏳ 미구현
│   └── supabase.ts       # ⏳ Supabase 클라이언트
│
├── api/                  # ⏳ 미구현 (API 추상화 레이어)
│   ├── auth.ts           # ⏳ 인증 API
│   ├── workers.ts        # ⏳ 근로자 API
│   ├── attendance.ts     # ⏳ 출퇴근 API
│   └── index.ts
│
├── hooks/                # ⏳ 폴더만 존재 (비어있음)
│   ├── useAuth.ts        # ⏳ 미구현
│   ├── useWorkers.ts     # ⏳ 미구현
│   ├── useAttendance.ts  # ⏳ 미구현
│   └── useRealtime.ts    # ⏳ 미구현
│
├── layouts/
│   └── MainLayout.tsx    # ✅ 공통 레이아웃
│
├── pages/                # ✅ 구현됨
│   ├── DashboardPage.tsx # ✅
│   ├── WorkersPage.tsx   # ✅
│   ├── AttendancePage.tsx# ✅
│   └── SettingsPage.tsx  # ✅
│
├── components/           # ✅ 구현됨
│   ├── Header.tsx        # ✅
│   ├── Sidebar.tsx       # ✅
│   ├── KpiCard.tsx       # ✅
│   ├── workers/          # ✅
│   │   ├── WorkerAddModal.tsx
│   │   ├── WorkerDetailModal.tsx
│   │   └── WorkerExcelUploadModal.tsx
│   └── settings/         # ✅
│       ├── AccountSettings.tsx
│       ├── SiteSettings.tsx
│       ├── TeamManagement.tsx
│       └── AdminManagement.tsx
│
├── context/              # 🚧 부분 구현
│   ├── AuthContext.tsx   # ⏳ 미구현
│   └── SitesContext.tsx  # ✅ 구현됨
│
└── types/                # ⏳ 미구현 (shared 패키지 사용 중)
    └── index.ts
```

### 5.2 라우팅 구조

```tsx
// App.tsx
<Routes>
  <Route element={<MainLayout />}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/workers" element={<WorkersPage />} />
    <Route path="/attendance" element={<AttendancePage />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Route>
  <Route path="/login" element={<LoginPage />} />
</Routes>
```

### 5.3 API 추상화 레이어

```typescript
// api/workers.ts
// Supabase에서 다른 백엔드로 전환 시 이 파일만 수정

import { supabase } from '@/lib/supabase';
import type { Worker } from '@tong-pass/shared';

export const workersApi = {
  // 목록 조회
  async findAll(siteId: number): Promise<Worker[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  },

  // 단건 조회
  async findById(id: string): Promise<Worker> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // 생성
  async create(worker: Partial<Worker>): Promise<Worker> {
    const { data, error } = await supabase
      .from('users')
      .insert(worker)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 수정
  async update(id: string, worker: Partial<Worker>): Promise<Worker> {
    const { data, error } = await supabase
      .from('users')
      .update(worker)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};
```

### 5.4 실시간 구독

```typescript
// hooks/useRealtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useAttendanceRealtime(siteId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendances',
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          // 캐시 무효화 → 자동 리페치
          queryClient.invalidateQueries({ 
            queryKey: ['attendance', siteId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['dashboard', siteId] 
          });
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

## 6. Supabase 구성

### 6.1 프로젝트 구조

```
backend/
├── README.md
├── supabase/
│   ├── config.toml           # 로컬 개발 설정
│   ├── migrations/           # DB 스키마
│   │   ├── 00001_create_tables.sql
│   │   ├── 00002_rls_policies.sql
│   │   └── 00003_client_profiles.sql
│   └── seed/
│       └── seed.sql          # 테스트 데이터
└── functions/                # Edge Functions
    ├── check-in/
    │   └── index.ts
    └── check-out/
        └── index.ts
```

### 6.2 Edge Functions

**출근 처리 (check-in)**:
```typescript
// supabase/functions/check-in/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { qrPayload, scannerId } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. QR 페이로드 검증
  const decoded = verifyQRPayload(qrPayload);
  if (!decoded.valid) {
    return new Response(JSON.stringify({ error: 'Invalid QR' }), { status: 400 });
  }

  // 2. 근로자 정보 조회
  const { data: worker } = await supabase
    .from('users')
    .select('*, partners(*)')
    .eq('id', decoded.workerId)
    .single();

  // 3. 출근 기록 생성
  const { data: attendance, error } = await supabase
    .from('attendances')
    .insert({
      work_date: new Date().toISOString().split('T')[0],
      site_id: worker.site_id,
      partner_id: worker.partner_id,
      user_id: worker.id,
      worker_name: worker.name,
      check_in_time: new Date().toISOString(),
      is_senior: calculateAge(worker.birth_date) >= 65,
    })
    .select()
    .single();

  return new Response(JSON.stringify({ 
    success: true, 
    attendanceId: attendance.id 
  }));
});
```

**자동 퇴근 처리 (auto-checkout)**:
```typescript
// supabase/functions/auto-checkout/index.ts
// Supabase Cron 또는 외부 스케줄러에서 매시간 호출

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 8시간 경과한 미퇴근 기록 조회
  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
  
  const { data: targets } = await supabase
    .from('attendances')
    .select('*')
    .is('check_out_time', null)
    .lt('check_in_time', eightHoursAgo.toISOString());

  // 일괄 퇴근 처리
  for (const attendance of targets) {
    await supabase
      .from('attendances')
      .update({
        check_out_time: new Date().toISOString(),
        is_auto_out: true,
      })
      .eq('id', attendance.id);
  }

  return new Response(JSON.stringify({ 
    processed: targets.length 
  }));
});
```

### 6.3 Row Level Security (RLS)

역할별 데이터 접근 제어:

| 역할 | companies | sites | partners | users | attendances |
|------|:---------:|:-----:|:--------:|:-----:|:-----------:|
| SUPER_ADMIN | 전체 | 전체 | 전체 | 전체 | 전체 |
| SITE_ADMIN | X | 본인 현장 | 본인 현장 | 현장 소속 | 현장 기록 |
| TEAM_ADMIN | X | 조회만 | X | 팀원만 | 팀 기록 |
| WORKER | X | 조회만 | X | 본인만 | 본인 기록 |

```sql
-- 예시: attendances 테이블 RLS
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- SUPER_ADMIN: 전체 접근
CREATE POLICY "super_admin_all" ON attendances
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- SITE_ADMIN: 본인 현장만
CREATE POLICY "site_admin_own_site" ON attendances
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SITE_ADMIN'
      AND users.site_id = attendances.site_id
    )
  );

-- WORKER: 본인 기록만
CREATE POLICY "worker_own_records" ON attendances
  FOR SELECT
  USING (user_id = auth.uid());
```

---

## 7. 데이터 흐름

### 7.1 출근 처리 플로우

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 근로자 앱    │    │  관리자 웹   │    │  Supabase   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │  QR 표시 (30초)   │                  │
       │ ─────────────────>│                  │
       │                  │                  │
       │                  │  QR 스캔          │
       │                  │ ─────────────────>│
       │                  │                  │
       │                  │  Edge Function    │
       │                  │  (check-in)       │
       │                  │ <─────────────────│
       │                  │                  │
       │                  │  Realtime 알림    │
       │                  │ <═════════════════│
       │                  │                  │
       │  푸시 알림        │                  │
       │ <─────────────────│                  │
```

### 7.2 대시보드 실시간 업데이트

```
┌─────────────┐    ┌─────────────┐
│  관리자 웹   │    │  Supabase   │
└─────────────┘    └─────────────┘
       │                  │
       │  Realtime 구독    │
       │ ─────────────────>│
       │                  │
       │  출퇴근 변경       │
       │ <═════════════════│ (WebSocket)
       │                  │
       │  React Query     │
       │  캐시 무효화      │
       │                  │
       │  UI 자동 갱신     │
       │                  │
```

---

## 8. 설정 파일

### 8.1 Vite (admin-web)

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 8.2 환경 변수

```bash
# apps/admin-web/.env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# apps/worker-mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8.3 Tailwind

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          500: '#F97316',  // Primary
          600: '#EA580C',
        },
      },
    },
  },
};
```

---

## 9. 개발 명령어

### 9.1 로컬 개발

```bash
# 전체 의존성 설치
pnpm install

# Supabase 로컬 시작
pnpm supabase:start

# 관리자 웹 개발 서버
pnpm dev:admin  # localhost:5173

# 모바일 앱 개발
pnpm dev:mobile  # Expo DevTools
```

### 9.2 Supabase 명령어

```bash
# backend/supabase 디렉토리에서 실행
cd backend/supabase

# 로컬 Supabase 시작
supabase start

# 마이그레이션 생성
supabase migration new <name>

# 마이그레이션 적용
supabase db push

# 시드 데이터 적용
supabase db reset

# Edge Functions 로컬 실행 (backend 디렉토리에서)
cd backend && supabase functions serve
```

### 9.3 빌드 및 배포

```bash
# 관리자 웹 빌드
pnpm build:admin  # dist/ 폴더 생성

# 모바일 앱 빌드
pnpm build:mobile  # EAS Build

# Supabase 프로덕션 배포
supabase db push --linked
supabase functions deploy
```

---

## 10. Phase 2 확장 계획 (교대 근무)

### 10.1 추가 필요 사항

| 기능 | 구현 방법 | 복잡도 |
|------|----------|--------|
| 2교대/3교대 설정 | DB 스키마 확장 | 🟡 중간 |
| 야간조 익일 퇴근 | Edge Functions 로직 추가 | 🟡 중간 |
| 교대 스케줄링 | 외부 스케줄러 (Vercel Cron 등) | 🔴 높음 |
| 교대 중첩 허용 | Edge Functions 로직 추가 | 🟡 중간 |

### 10.2 외부 스케줄러 연동 (예정)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Vercel Cron │───>│   Supabase  │───>│  Database   │
│ (매시간)     │    │ Edge Func.  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 11. 관련 문서

- [프로젝트 개요](./PROJECT-OVERVIEW.md)
- [데이터베이스 설계](./DATABASE.md)
- [개발 가이드](./DEVELOPMENT.md)
