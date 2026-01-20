# admin-web 전체 API 연동 로드맵

> **브랜치**: dashboard-api-connection
> **목표**: 모든 목업 데이터를 실제 Supabase API로 전환
> **기간**: 2-3주 예상

---

## 주차별 작업 계획

### Week 1: 인증 및 기본 데이터 흐름 확립

#### Day 1-2: 온보딩 플로우 완성 ⭐ 최우선
- [ ] `signup` Edge Function 수정
  - 파일: `backend/supabase/functions/signup/index.ts`
  - 변경: `companies`, `sites` 테이블 생성 로직 추가
  - 트랜잭션으로 3개 테이블 동시 생성 (companies → sites → users)
- [ ] `users` 테이블에 온보딩 정보 저장
  - CEO 이름, 회사 주소, 직원수 범위 등
  - `client_profiles` 테이블 활용 검토
- [ ] 회원가입 후 자동 로그인 시 `user.siteId`, `user.companyId` 확인
- [ ] 테스트: 온보딩 전체 플로우 통합 테스트

#### Day 3: AuthContext 개선
- [ ] `getCurrentUser()` 수정
  - 파일: `apps/admin-web/src/api/auth.ts`
  - 조인으로 `companies`, `sites` 정보 함께 조회
  ```typescript
  const { data: profile } = await supabase
    .from('users')
    .select(`
      *,
      companies:company_id(id, name, business_number),
      sites:site_id(id, name, address)
    `)
    .eq('id', user.id)
    .single();
  ```
- [ ] `AuthUser` 타입 확장
  ```typescript
  export interface AuthUser {
    id: string;
    phone: string;
    name: string;
    role: UserRole;
    companyId: number | null;
    companyName?: string;
    siteId: number | null;
    siteName?: string;
    partnerId: number | null;
  }
  ```

#### Day 4: SitesContext API 연동
- [ ] Mock 초기화 제거
  - 파일: `apps/admin-web/src/context/SitesContext.tsx`
  - `initialSites` 삭제
- [ ] `useEffect`로 API 호출
  ```typescript
  useEffect(() => {
    async function loadSites() {
      const data = await getSites();
      setSites(data);
      // SUPER_ADMIN: 전체, SITE_ADMIN: 본인 현장만
      const filtered = user?.role === 'SUPER_ADMIN'
        ? data
        : data.filter(s => s.id === user?.siteId);
      setSelectedSite(filtered[0] || null);
    }
    loadSites();
  }, [user]);
  ```

#### Day 5: 대시보드 API 완전 연동
- [ ] 회사 정보 API 생성
  - 파일: `apps/admin-web/src/api/companies.ts` (신규)
  - `getCompanyById(id)` 함수
- [ ] `DashboardPage` Mock 제거
  - `mockCompanyInfo` 삭제 (Line 46-50)
  - `loadData()`에서 회사 정보도 함께 조회
- [ ] 에러 처리 강화
  - API 실패 시 사용자 친화적 메시지
  - Retry 버튼 동작 확인

---

### Week 2: 근로자 및 팀 관리 API 연동

#### Day 6-7: React Query 설정
- [ ] Query Client 설정 확인
  - 파일: `apps/admin-web/src/lib/queryClient.ts`
  - 기본 옵션 설정 (staleTime, cacheTime, retry)
- [ ] 커스텀 훅 생성
  - `hooks/useWorkers.ts`
  - `hooks/usePartners.ts`
  - `hooks/useSites.ts`

```typescript
// hooks/useWorkers.ts 예시
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkers, createWorker, updateWorker, deleteWorker } from '@/api/workers';

export function useWorkers(options) {
  return useQuery({
    queryKey: ['workers', options],
    queryFn: () => getWorkers(options),
    staleTime: 1000 * 60 * 5,
    enabled: !!options.siteId, // siteId 있을 때만 실행
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// ... updateWorker, deleteWorker 동일 패턴
```

#### Day 8-9: 팀 관리 API 연동
- [ ] `TeamManagement` 컴포넌트 수정
  - 파일: `apps/admin-web/src/components/settings/TeamManagement.tsx`
  - `usePartners()` 훅 사용
  ```typescript
  const { data: teams, isLoading } = usePartners(user?.siteId);
  const createMutation = useCreatePartner();
  ```
- [ ] 팀 추가 모달 연결
  - `handleAddTeam` → `createMutation.mutate(newTeam)`
- [ ] 근로자 수 실시간 표시
  - `getPartnersWithWorkerCount()` 사용

#### Day 10: 관리자 관리 API 구현
- [ ] `api/admins.ts` 생성 (신규)
  ```typescript
  export async function getAdmins(siteId: number) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('site_id', siteId)
      .in('role', ['SUPER_ADMIN', 'SITE_ADMIN', 'TEAM_ADMIN'])
      .order('name');
    if (error) throw error;
    return data;
  }
  ```
- [ ] `AdminManagement` 컴포넌트 연결
  - `useAdmins()` 훅 사용
  - 추가/수정 모달 API 연결

---

### Week 3: 출퇴근 현황 및 Realtime 통합

#### Day 11-12: 근로자 관리 페이지 완성
- [ ] `WorkersPage` Mock 제거
  - `mockTeams`, `mockWorkers` 삭제 (Line 36-62)
  - `useWorkers()` 훅으로 대체
- [ ] 검색/필터 서버 사이드로 전환
  - 현재: `useMemo`로 클라이언트 필터링
  - 변경: `useWorkers({ search, roleFilter, statusFilter })`
- [ ] 페이지네이션 서버 사이드
  - API에 `offset`, `limit` 파라미터 추가
  - `getWorkers({ offset: page * 10, limit: 10 })`
- [ ] CRUD 모달 연결
  - `WorkerAddModal` → `useCreateWorker()`
  - `WorkerDetailModal` → `useUpdateWorker()`
  - 승인/차단 → `useUpdateWorker()` (status 변경)

#### Day 13-14: 출퇴근 현황 API 연동
- [ ] `AttendancePage` Mock 제거
  - `mockAttendanceData` 삭제
  - `useAttendance()` 훅 생성
  ```typescript
  const { data: records, isLoading } = useAttendance({
    siteId: user?.siteId,
    workDate: selectedDate,
    partnerId: selectedTeam,
    search: searchQuery,
  });
  ```
- [ ] QR 출근 기능 연결
  - `CheckInModal` → `checkInWithQR()` API
  - QR 스캐너 컴포넌트 활성화
- [ ] 수동 퇴근 처리
  - `handleManualCheckout` → `checkOut(attendanceId)`

#### Day 15: Realtime 통합
- [ ] `useRealtimeAttendance` 훅 활성화
  - 파일: `apps/admin-web/src/hooks/useRealtimeAttendance.ts`
  - `AttendancePage`에서 사용
  ```typescript
  const { data, isLoading } = useAttendance(...);
  useRealtimeAttendance(user?.siteId, (newRecord) => {
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
  });
  ```
- [ ] 대시보드 Realtime 구독
  - `DashboardPage`에서 출퇴근 변경 시 KPI 자동 갱신
  ```typescript
  useRealtimeAttendance(user?.siteId, () => {
    loadData(); // KPI 재조회
  });
  ```

---

## 세부 작업 체크리스트

### A. 온보딩 플로우 (Week 1, Day 1-2)

#### A-1. signup Edge Function 수정
```typescript
// backend/supabase/functions/signup/index.ts

interface SignupRequest {
  // 기존
  verificationToken: string;
  name: string;
  phone: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed?: boolean;
  password: string;

  // 추가
  companyName: string;
  businessNumber: string;
  ceoName: string;
  companyAddress: string;
  employeeCountRange?: string;
  siteName: string;
  siteAddress?: string;
  checkoutPolicy?: 'AUTO_8H' | 'MANUAL';
  autoHours?: number;
}

// 트랜잭션 로직
const { data: company, error: companyError } = await supabase
  .from('companies')
  .insert({
    name: companyName,
    business_number: businessNumber,
    contact_email: null,
    contact_phone: phone,
  })
  .select()
  .single();

const { data: site, error: siteError } = await supabase
  .from('sites')
  .insert({
    company_id: company.id,
    name: siteName,
    address: siteAddress,
    checkout_policy: checkoutPolicy || 'AUTO_8H',
    auto_hours: autoHours || 8,
  })
  .select()
  .single();

// users 테이블에 site_id, company_id 저장
```

#### A-2. client_profiles 활용
- [ ] CEO 이름, 회사 주소 등은 `client_profiles` 테이블에 저장
- [ ] `companies.id` → `client_profiles.company_id` 외래키 연결

---

### B. Context/페이지 API 연동 패턴

#### 변경 전 (Mock 사용)
```typescript
// SitesContext.tsx
const [sites, setSites] = useState<Site[]>(initialSites); // Mock
```

#### 변경 후 (API 사용)
```typescript
const [sites, setSites] = useState<Site[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchSites() {
    try {
      const data = await getSites();
      setSites(data);
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    } finally {
      setLoading(false);
    }
  }
  fetchSites();
}, []);
```

#### React Query 사용 시 (최종)
```typescript
const { data: sites = [], isLoading } = useSites();
```

---

### C. React Query 마이그레이션 가이드

#### Step 1: API 함수는 그대로 유지
```typescript
// api/workers.ts
export async function getWorkers(options) {
  const { data, error } = await supabase.from('users').select(...);
  if (error) throw error;
  return data;
}
```

#### Step 2: 커스텀 훅 생성
```typescript
// hooks/useWorkers.ts
export function useWorkers(options) {
  return useQuery({
    queryKey: ['workers', options],
    queryFn: () => getWorkers(options),
  });
}
```

#### Step 3: 컴포넌트에서 사용
```typescript
// WorkersPage.tsx
const { data: workers = [], isLoading, error } = useWorkers({
  siteId: user?.siteId,
  search: searchQuery,
});

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
```

---

### D. Realtime 구독 패턴

#### 출퇴근 Realtime
```typescript
// hooks/useRealtimeAttendance.ts (이미 존재)
export function useRealtimeAttendance(
  siteId: number | null,
  workDate: string,
  onUpdate: (record: Attendance) => void
) {
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
        (payload) => {
          onUpdate(payload.new as Attendance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId, workDate]);
}
```

#### 페이지에서 사용
```typescript
// AttendancePage.tsx
const queryClient = useQueryClient();

useRealtimeAttendance(user?.siteId, selectedDate, () => {
  queryClient.invalidateQueries({ queryKey: ['attendance'] });
});
```

---

## 파일별 작업 목록

### 수정 필요 파일 (우선순위 순)

1. **backend/supabase/functions/signup/index.ts** ⭐⭐⭐
   - 온보딩 데이터 DB 저장 로직 추가

2. **apps/admin-web/src/api/auth.ts**
   - `getCurrentUser()` 조인 추가
   - `AuthUser` 타입 확장

3. **apps/admin-web/src/context/SitesContext.tsx**
   - Mock 제거, API 호출 추가

4. **apps/admin-web/src/pages/DashboardPage.tsx**
   - `mockCompanyInfo` 제거
   - 회사 정보 API 연결

5. **apps/admin-web/src/api/companies.ts** (신규)
   - `getCompanyById()` 함수 생성

6. **apps/admin-web/src/hooks/useWorkers.ts** (신규)
   - React Query 훅 생성

7. **apps/admin-web/src/hooks/usePartners.ts** (신규)
   - React Query 훅 생성

8. **apps/admin-web/src/hooks/useAttendance.ts** (신규)
   - React Query 훅 생성

9. **apps/admin-web/src/pages/WorkersPage.tsx**
   - Mock 제거 (Line 36-62)
   - `useWorkers()` 훅 사용

10. **apps/admin-web/src/pages/AttendancePage.tsx**
    - Mock 제거
    - `useAttendance()` + `useRealtimeAttendance()` 통합

11. **apps/admin-web/src/components/settings/TeamManagement.tsx**
    - `usePartners()` 훅 사용

12. **apps/admin-web/src/components/settings/AdminManagement.tsx**
    - `useAdmins()` 훅 사용

13. **apps/admin-web/src/api/admins.ts** (신규)
    - 관리자 CRUD API

---

## 테스트 체크리스트

### 온보딩 플로우
- [ ] 회원가입 완료 후 `companies`, `sites`, `users` 테이블에 데이터 생성 확인
- [ ] 로그인 시 `user.companyId`, `user.siteId` null이 아님
- [ ] `user.role`이 'SUPER_ADMIN'으로 설정됨
- [ ] 대시보드 진입 시 실제 데이터 로드 (목업 X)

### 대시보드
- [ ] KPI 카드에 실제 데이터 표시
- [ ] 회사 정보 카드에 온보딩 시 입력한 정보 표시
- [ ] 출퇴근 발생 시 KPI 실시간 갱신 (Realtime)

### 현장/팀 관리
- [ ] 현장 목록 조회 (SUPER_ADMIN: 전체, SITE_ADMIN: 본인 현장)
- [ ] 팀 추가 → 목록 자동 갱신
- [ ] 팀 삭제 → 소속 근로자 처리 (partner_id null 또는 에러)

### 근로자 관리
- [ ] 근로자 목록 조회
- [ ] 검색/필터 작동
- [ ] 근로자 추가 (수동 입력)
- [ ] 엑셀 업로드 (Phase 2)
- [ ] 승인대기 → 승인/반려
- [ ] 차단 처리

### 출퇴근 현황
- [ ] 당일 출퇴근 기록 조회
- [ ] QR 스캔 출근 (모바일 연동 필요)
- [ ] 수동 퇴근 처리
- [ ] 실시간 출근 알림 (Realtime)

---

## 예상 이슈 및 대응

### Issue 1: `user.siteId`가 null
**원인**: 회원가입 시 site 생성 실패
**해결**: signup Edge Function 로그 확인, 트랜잭션 에러 처리

### Issue 2: RLS 정책으로 데이터 조회 불가
**원인**: 사용자 role에 맞는 정책 부재
**해결**: `backend/supabase/migrations/00002_rls_policies.sql` 확인

### Issue 3: Realtime 구독 안됨
**원인**: Supabase Realtime 설정 부족
**해결**: Supabase 대시보드에서 Realtime 활성화 확인

### Issue 4: React Query 캐시 무효화 안됨
**원인**: queryKey 불일치
**해결**: queryKey 일관성 유지, DevTools로 디버깅

---

## 성공 기준

### Week 1 종료 시
- ✅ 회원가입 → 로그인 → 대시보드에 실제 데이터 표시
- ✅ 현장 목록이 API에서 조회됨
- ✅ Mock 데이터 사용 안함 (대시보드, 현장 관리)

### Week 2 종료 시
- ✅ 근로자 목록 실제 데이터
- ✅ 팀 관리 CRUD 작동
- ✅ React Query 도입 (근로자, 팀, 현장)

### Week 3 종료 시
- ✅ 출퇴근 현황 실제 데이터
- ✅ QR 출퇴근 작동
- ✅ Realtime 구독 활성화
- ✅ 모든 Mock 데이터 제거

---

## 다음 단계

1. **즉시 시작**: Week 1 Day 1-2 작업 (온보딩 플로우)
2. **병렬 작업 가능**: React Query 훅 생성 (Day 6-7)은 미리 준비 가능
3. **최종 목표**: 3주 후 완전한 API 연동 시스템
