# 통패스 개발 가이드

## 1. 개발 환경 설정

### 1.1 필수 요구사항

| 도구 | 버전 | 용도 |
|------|------|------|
| Node.js | 18+ | 런타임 |
| pnpm | 9.15+ | 패키지 매니저 |
| Supabase CLI | 최신 | 로컬 백엔드 |
| Git | 최신 | 버전 관리 |

### 1.2 프로젝트 설치

```bash
# 저장소 클론
git clone <repository-url>
cd tong-pass

# 의존성 설치 (모든 워크스페이스)
pnpm install

# Supabase CLI 설치 (없는 경우)
npm install -g supabase
```

### 1.3 환경 변수 설정

```bash
# apps/admin-web/.env.local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# apps/worker-mobile/.env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

---

## 2. 개발 명령어

### 2.1 Supabase 로컬 개발

```bash
# backend/supabase 디렉토리로 이동
cd backend/supabase

# Supabase 로컬 시작
supabase start

# 시작 후 제공되는 정보:
# - API URL: http://localhost:54321
# - anon key: eyJ...
# - Studio URL: http://localhost:54323

# Supabase 중지
supabase stop

# 데이터베이스 리셋 (마이그레이션 + 시드)
supabase db reset

# 마이그레이션 생성
supabase migration new <migration_name>

# Edge Functions 로컬 실행 (backend 디렉토리에서)
cd backend && supabase functions serve
```

### 2.2 개발 서버

```bash
# 관리자 웹 (localhost:5173)
pnpm dev:admin

# 근로자 모바일 앱 (Expo DevTools)
pnpm dev:mobile

# 공유 패키지 빌드 (타입 변경 시)
pnpm build:shared

# 전체 개발 서버 (병렬 실행)
pnpm dev
```

### 2.3 빌드

```bash
# 관리자 웹 프로덕션 빌드
pnpm build:admin

# 모바일 앱 빌드 (EAS)
pnpm build:mobile
```

### 2.4 린트 및 정리

```bash
# 전체 린트
pnpm lint

# 전체 포맷팅
pnpm format

# 타입 체크
pnpm typecheck
```

---

## 3. 프로젝트 구조

### 3.1 워크스페이스

```
tong-pass/
├── apps/
│   ├── admin-web/        # 관리자 웹
│   └── worker-mobile/    # 근로자 앱
├── packages/
│   └── shared/           # 공유 패키지
└── backend/
    ├── supabase/         # Supabase 설정
    └── functions/        # Edge Functions
```

### 3.2 경로 별칭

```typescript
// admin-web, worker-mobile
import { Component } from '@/components/Component';

// 공유 패키지 사용
import { Worker, Site } from '@tong-pass/shared';
import { SENIOR_AGE_THRESHOLD } from '@tong-pass/shared/constants';
import { calculateAge } from '@tong-pass/shared/utils';
```

---

## 4. 코딩 컨벤션

### 4.1 TypeScript

```typescript
// 타입 정의는 @tong-pass/shared 사용
import type { Worker, UserRole } from '@tong-pass/shared';

// 컴포넌트 Props 타입
interface WorkerCardProps {
  worker: Worker;
  onSelect: (id: string) => void;
}

// 함수 컴포넌트
export function WorkerCard({ worker, onSelect }: WorkerCardProps) {
  return <div onClick={() => onSelect(worker.id)}>{worker.name}</div>;
}
```

### 4.2 파일 명명

| 유형 | 형식 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `WorkerCard.tsx` |
| 페이지 | PascalCase + Page | `DashboardPage.tsx` |
| 모달 | PascalCase + Modal | `WorkerDetailModal.tsx` |
| 훅 | camelCase + use | `useWorkers.ts` |
| API | camelCase | `workers.ts` |
| 유틸 | camelCase | `calculateAge.ts` |

### 4.3 컴포넌트 구조

```typescript
// 1. imports (외부 → 내부)
import { useState } from 'react';
import { Edit, Trash } from 'lucide-react';
import type { Worker } from '@tong-pass/shared';
import { Button } from '@/components/ui/Button';

// 2. types
interface Props {
  worker: Worker;
}

// 3. component
export function WorkerCard({ worker }: Props) {
  // 3.1 state
  const [isEditing, setIsEditing] = useState(false);

  // 3.2 handlers
  const handleEdit = () => setIsEditing(true);

  // 3.3 render
  return (
    <div className="p-4 rounded-xl border">
      <h3>{worker.name}</h3>
      <Button onClick={handleEdit}>
        <Edit className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

---

## 5. Supabase 연동

### 5.1 클라이언트 설정

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### 5.2 API 추상화 레이어

```typescript
// api/workers.ts
import { supabase } from '@/lib/supabase';
import type { Worker } from '@tong-pass/shared';

export const workersApi = {
  async findAll(siteId: number): Promise<Worker[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  },

  async findById(id: string): Promise<Worker> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(worker: Partial<Worker>): Promise<Worker> {
    const { data, error } = await supabase
      .from('users')
      .insert(worker)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

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

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  },
};
```

### 5.3 React Query 훅

```typescript
// hooks/useWorkers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workersApi } from '@/api/workers';

export function useWorkers(siteId: number) {
  return useQuery({
    queryKey: ['workers', siteId],
    queryFn: () => workersApi.findAll(siteId),
    enabled: !!siteId,
  });
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: ['worker', id],
    queryFn: () => workersApi.findById(id),
    enabled: !!id,
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}
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
    if (!siteId) return;

    const channel = supabase
      .channel(`attendance-${siteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendances',
          filter: `site_id=eq.${siteId}`,
        },
        () => {
          // 캐시 무효화
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

## 6. 스타일링 가이드

### 6.1 Tailwind 클래스 순서

```tsx
className={`
  // 1. 레이아웃 (display, position)
  flex items-center justify-between
  // 2. 크기 (width, height, padding, margin)
  w-full p-4 mb-2
  // 3. 배경/테두리
  bg-white rounded-xl border border-gray-200
  // 4. 텍스트
  text-sm font-medium text-slate-800
  // 5. 상호작용/전환
  hover:bg-orange-50 transition-colors cursor-pointer
`}
```

### 6.2 브랜드 컬러

```tsx
// Primary 버튼
className="bg-gradient-to-r from-orange-500 to-orange-600
           hover:from-orange-600 hover:to-orange-700
           text-white font-bold rounded-xl"

// Secondary 버튼
className="bg-gray-100 hover:bg-gray-200
           text-slate-700 font-medium rounded-xl"

// 활성 상태
className="bg-orange-50 text-orange-600"
```

### 6.3 반응형 디자인

```tsx
// 모바일 우선
className="
  flex flex-col           // 기본: 세로
  md:flex-row            // 768px+: 가로
  gap-4
"

// 사이드바 숨김
className="
  hidden                  // 기본: 숨김
  lg:flex                // 1024px+: 표시
"
```

---

## 7. 인증 구현

### 7.1 AuthContext

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 세션 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 7.2 Protected Route

```typescript
// components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

---

## 8. Edge Functions 개발

### 8.1 함수 생성

```bash
# 새 함수 생성
supabase functions new check-in
```

### 8.2 함수 구조

```typescript
// supabase/functions/check-in/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { qrPayload, scannerId } = await req.json();

    // 비즈니스 로직...

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 8.3 로컬 테스트

```bash
# 함수 실행
supabase functions serve check-in

# 테스트 요청
curl -X POST http://localhost:54321/functions/v1/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{"qrPayload": "...", "scannerId": "..."}'
```

---

## 9. 테스트

### 9.1 단위 테스트 (예정)

```bash
# Vitest 실행
pnpm test

# 특정 파일만
pnpm test src/utils/calculateAge.test.ts
```

### 9.2 E2E 테스트 (예정)

```bash
# Playwright 실행
pnpm test:e2e
```

---

## 10. 배포

### 10.1 Supabase 프로덕션

```bash
# 프로젝트 연결
supabase link --project-ref <project-id>

# 마이그레이션 배포
supabase db push

# Edge Functions 배포
supabase functions deploy
```

### 10.2 관리자 웹

```bash
# 빌드
pnpm build:admin

# dist/ 폴더를 정적 호스팅에 배포
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
```

### 10.3 모바일 앱

```bash
# EAS Build (Expo Application Services)
cd apps/worker-mobile
eas build --platform all

# 스토어 제출
eas submit
```

---

## 11. Git 워크플로우

### 11.1 브랜치 전략

```
main          # 프로덕션
├── develop   # 개발 통합
│   ├── feature/login        # 기능 개발
│   ├── feature/dashboard    # 기능 개발
│   └── fix/attendance-bug   # 버그 수정
```

### 11.2 커밋 메시지

```
feat: 근로자 상세 모달 추가
fix: 출퇴근 시간 계산 오류 수정
refactor: 필터 컴포넌트 분리
docs: 개발 가이드 작성
style: 버튼 색상 통일
chore: 의존성 업데이트
```

---

## 12. 관련 문서

- [프로젝트 개요](./PROJECT-OVERVIEW.md)
- [기술 아키텍처](./ARCHITECTURE.md)
- [데이터베이스 설계](./DATABASE.md)
