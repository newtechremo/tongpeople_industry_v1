# admin-web API 연동 현황 분석

> **작성일**: 2026-01-16
> **브랜치**: dashboard-api-connection
> **목적**: 관리자 웹의 API 연동 상태 파악 및 실제 백엔드 연동 로드맵 수립

---

## 1. 현재 API 연동 상태 요약

### 1.1 연동 현황표

| 기능 영역 | API 연동 상태 | 데이터 소스 | 우선순위 |
|----------|:------------:|-----------|:-------:|
| **인증 (Auth)** | ✅ 완료 | Supabase Auth + Edge Functions | - |
| **회원가입** | ✅ 완료 | Edge Function: `/signup` | - |
| **로그인** | ✅ 완료 | Edge Function: `/login` | - |
| **SMS 인증** | ✅ 완료 | Edge Functions: `/send-sms`, `/verify-sms` | - |
| **비밀번호 재설정** | ✅ 완료 | Edge Function: `/reset-password` | - |
| **현장 관리** | 🟡 부분 | Supabase Direct (목업 없음) | 1 |
| **팀/협력업체 관리** | 🟡 부분 | Supabase Direct (목업 없음) | 2 |
| **근로자 관리** | 🔴 목업 | Mock Data (WorkersPage.tsx) | 3 |
| **출퇴근 현황** | 🔴 목업 | Mock Data (AttendancePage.tsx) | 4 |
| **대시보드 KPI** | 🟡 부분 | API 있으나 목업 폴백 | 5 |
| **관리자 정보 입력** | 🔴 없음 | 미구현 | 6 |

**범례**:
- ✅ 완료: 실제 API 연동 완료
- 🟡 부분: API는 있으나 목업과 혼용 또는 UI만 존재
- 🔴 목업: 완전히 Mock 데이터 사용 또는 미구현

---

## 2. 상세 분석

### 2.1 인증 (Auth) ✅

#### 구현 위치
- `/apps/admin-web/src/api/auth.ts`
- `/apps/admin-web/src/context/AuthContext.tsx`
- Edge Functions: `signup`, `login`, `send-sms`, `verify-sms`, `reset-password`

#### 상태
- **완전히 작동함**: SMS 인증, 회원가입, 로그인, 비밀번호 재설정
- Supabase Auth와 Custom Edge Function 조합
- 전화번호 기반 인증 (이메일 X)

#### 온보딩 플로우 문제
```
현재: 회원가입 → 즉시 로그인 → 대시보드
문제: 관리자 추가 정보 입력 단계 없음
```

**필요한 작업**:
1. 회원가입 후 `users` 테이블에 추가 정보 저장 로직 부재
2. 온보딩 스텝 (Step1~4) 데이터가 DB에 저장되지 않음
3. 최초 로그인 시 정보 입력 강제 리디렉션 필요

---

### 2.2 현장 관리 (Sites) 🟡

#### 구현 위치
- `/apps/admin-web/src/api/sites.ts`
- `/apps/admin-web/src/context/SitesContext.tsx`

#### 상태
- **API는 완성**: `getSites`, `createSite`, `updateSite`, `deleteSite`
- **문제**: `SitesContext`가 목업 데이터로 초기화됨
  ```typescript
  // context/SitesContext.tsx (Line 5-24)
  const initialSites: Site[] = [
    {
      id: 1,
      name: '통하는사람들 서울본사',
      address: '서울특별시 강남구 테헤란로 123',
      // ...
    },
    // ...
  ];
  ```

**필요한 작업**:
1. `SitesContext` 초기화 시 `getSites()` API 호출로 변경
2. `AuthContext`의 `user.siteId` 기반으로 현장 필터링
3. SUPER_ADMIN은 전체, SITE_ADMIN은 본인 현장만 조회

---

### 2.3 팀/협력업체 관리 (Partners) 🟡

#### 구현 위치
- `/apps/admin-web/src/api/partners.ts`
- `/apps/admin-web/src/components/settings/TeamManagement.tsx`

#### 상태
- **API 완성**: `getPartners`, `createPartner`, `updatePartner`, `deletePartner`
- **근로자 수 포함 조회**: `getPartnersWithWorkerCount()` 존재
- **문제**: UI 컴포넌트가 API 호출 안 함 (추정)

**필요한 작업**:
1. `TeamManagement` 컴포넌트에서 `getPartners()` 호출
2. React Query로 캐싱 및 자동 리페치 구현
3. 팀 추가/수정 시 목록 자동 갱신

---

### 2.4 근로자 관리 (Workers) 🔴

#### 구현 위치
- `/apps/admin-web/src/api/workers.ts` (API 완성)
- `/apps/admin-web/src/pages/WorkersPage.tsx` (목업 사용)

#### 상태
- **API는 완성**: `getWorkers`, `createWorker`, `updateWorker`, `deleteWorker`, `getWorkerStats`
- **문제**: `WorkersPage`가 완전히 Mock 데이터 사용

```typescript
// WorkersPage.tsx (Line 36-62)
const mockTeams: Team[] = [ /* ... */ ];
const mockWorkers: Worker[] = [ /* ... */ ]; // 12명의 목업 데이터
```

**필요한 작업**:
1. Mock 데이터 제거
2. `useEffect` + `getWorkers()` 호출로 실제 데이터 로드
3. 검색/필터/페이지네이션을 서버 사이드로 전환 (현재는 클라이언트 필터링)
4. 근로자 추가/수정 모달과 API 연결

---

### 2.5 출퇴근 현황 (Attendance) 🔴

#### 구현 위치
- `/apps/admin-web/src/api/attendance.ts` (API 완성)
- `/apps/admin-web/src/pages/AttendancePage.tsx` (목업 사용)
- `/apps/admin-web/src/hooks/useRealtimeAttendance.ts` (Realtime 준비됨)

#### 상태
- **API 완성**: `getAttendanceRecords`, `checkIn`, `checkOut`, `getDashboardSummary`, `getAttendanceByPartner`
- **Realtime Hook 준비됨**: `useRealtimeAttendance.ts` 존재
- **문제**: `AttendancePage`가 완전히 Mock 데이터 사용

```typescript
// AttendancePage.tsx (Line 51-100)
const mockAttendanceData: AttendanceRecord[] = [ /* ... */ ];
```

**필요한 작업**:
1. Mock 데이터 제거
2. `getAttendanceRecords()` API 호출
3. `useRealtimeAttendance` 훅 통합 (실시간 출퇴근 반영)
4. QR 스캔 모달과 `checkInWithQR()` 연결

---

### 2.6 대시보드 KPI 🟡

#### 구현 위치
- `/apps/admin-web/src/pages/DashboardPage.tsx`
- `/apps/admin-web/src/api/attendance.ts` (`getDashboardSummary`)

#### 상태
- **API 호출 로직 존재** (Line 79-107)
  ```typescript
  const loadData = useCallback(async () => {
    if (!user?.siteId) {
      setUseMockData(true);
      return;
    }
    const summary = await getDashboardSummary(user.siteId, workDate);
    if (summary.totalWorkers > 0) {
      setData(summary);
      setUseMockData(false);
    } else {
      setUseMockData(true);
    }
  }, [user?.siteId]);
  ```
- **문제**: `user.siteId`가 없으면 목업 폴백 → AuthContext 통합 필요

**필요한 작업**:
1. `AuthContext`에서 `user.siteId` 제대로 로드되도록 수정
2. 회사 정보도 API에서 가져오기 (현재 목업: Line 46-50)
3. 차트 데이터 연결 (`getAttendanceByPartner`)

---

### 2.7 관리자 정보 입력 🔴

#### 현재 상황
- **온보딩 플로우**: `Step1Personal` → `Step2Company` → `Step3Site` → `Step4Password`
- **문제**: 회원가입 후 이 정보가 DB에 저장되지 않음
- `/apps/admin-web/src/hooks/useOnboarding.ts`가 localStorage만 사용

**필요한 온보딩 플로우**:
```
1. SMS 인증 (Step1)
2. 관리자 개인정보 입력 (Step1)
3. 회사 정보 입력 (Step2)
4. 현장 정보 입력 (Step3)
5. 비밀번호 설정 (Step4)
6. 회원가입 API 호출 ← 현재 여기까지만 구현됨
7. 로그인
8. 추가 정보 저장 (CEO명, 주소, 직원수 등) ← 이 부분 없음
```

**필요한 작업**:
1. `signup` Edge Function이 모든 온보딩 데이터를 받아 DB 저장
2. 또는 회원가입 후 별도 API (`/complete-onboarding`)로 추가 정보 저장
3. `companies`, `sites`, `users` 테이블에 온보딩 데이터 삽입

---

## 3. 데이터 흐름 분석

### 3.1 현재 인증 흐름 (작동 중)

```
┌─────────────┐
│ LoginPage   │
└──────┬──────┘
       │ login(phone, password)
       ▼
┌─────────────────────┐
│ Edge Function:      │
│ /login              │
└──────┬──────────────┘
       │ 1. users 조회
       │ 2. 비밀번호 확인
       │ 3. JWT 발급
       ▼
┌─────────────────────┐
│ AuthContext         │
│ setUser()           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ ProtectedRoute      │
│ → DashboardPage     │
└─────────────────────┘
```

### 3.2 현재 대시보드 데이터 흐름 (부분 작동)

```
┌─────────────────────┐
│ DashboardPage       │
└──────┬──────────────┘
       │ useEffect → loadData()
       ▼
┌─────────────────────┐      ┌─────────────────────┐
│ user?.siteId 존재?  │─Yes─→│ getDashboardSummary │
└──────┬──────────────┘      │ (API 호출)          │
       │ No                  └──────┬──────────────┘
       ▼                            │
┌─────────────────────┐             │ totalWorkers > 0?
│ useMockData = true  │             ├─Yes→ setData(summary)
│ (목업 데이터 표시)   │             └─No──→ useMockData = true
└─────────────────────┘
```

**문제**:
- `user.siteId`가 null이면 무조건 목업
- 회원가입 시 siteId 저장 로직 부재

---

## 4. Supabase 백엔드 상태

### 4.1 DB 스키마 (완성)

- ✅ **테이블**: `companies`, `sites`, `partners`, `users`, `attendance`
- ✅ **RLS 정책**: 역할 기반 접근 제어 (SUPER_ADMIN, SITE_ADMIN 등)
- ✅ **함수**: `calculate_age`, `get_work_date`, 권한 체크 함수들
- ✅ **인덱스**: 쿼리 최적화용 인덱스 설정

### 4.2 Edge Functions (부분 완성)

| 함수명 | 상태 | 설명 |
|--------|:----:|------|
| `signup` | ✅ | 회원가입 (SMS 인증 토큰 검증 → 계정 생성) |
| `login` | ✅ | 로그인 (phone + password) |
| `send-sms` | ✅ | SMS 인증코드 발송 |
| `verify-sms` | ✅ | SMS 인증코드 확인 |
| `reset-password` | ✅ | 비밀번호 재설정 |
| `check-in` | 🟡 | QR 스캔 출근 (API 있으나 프론트 미연결) |
| `check-out` | 🟡 | 퇴근 처리 (API 있으나 프론트 미연결) |
| `verify-company-code` | ✅ | 근로자앱용 회사코드 검증 |
| `register-worker` | ✅ | 근로자앱용 회원가입 |
| `worker-me` | ✅ | 근로자 본인 정보 조회 |
| `seed-workers` | ✅ | 테스트 데이터 생성용 |

---

## 5. 작업 우선순위 및 로드맵

### Phase 1: 인증 및 온보딩 완성 (우선순위 1)

**목표**: 회원가입 → 정보입력 → 현장생성까지 완전한 플로우

#### Task 1.1: 온보딩 데이터 DB 저장
- [ ] `signup` Edge Function 수정
  - `SignupRequest` 타입에 모든 온보딩 필드 포함
  - `companies`, `sites`, `users` 테이블 동시 생성 (트랜잭션)
- [ ] 회원가입 성공 시 `user.companyId`, `user.siteId` 자동 설정
- [ ] 테스트: 온보딩 → 로그인 → user.siteId 존재 확인

#### Task 1.2: AuthContext 개선
- [ ] `getCurrentUser()`에서 `company`, `site` 정보도 함께 조회
- [ ] AuthUser 타입에 `companyName`, `siteName` 추가
- [ ] 로그인 후 siteId 없으면 온보딩 페이지로 리디렉션

---

### Phase 2: 대시보드 실제 데이터 연동 (우선순위 2)

**목표**: KPI, 차트, 회사 정보를 실제 API로 전환

#### Task 2.1: 대시보드 API 연결
- [ ] Mock 데이터 제거 (Line 35-50)
- [ ] 회사 정보 API 생성 (`getCompanyById`)
- [ ] `loadData()` 개선: 에러 핸들링, 로딩 상태 명확화
- [ ] React Query로 캐싱 (`useQuery`)

#### Task 2.2: 차트 데이터 연결
- [ ] `getAttendanceByPartner()` → 소속별 인원 현황 차트
- [ ] 역할별 비율 파이 차트 데이터 생성
- [ ] Recharts 컴포넌트 통합

---

### Phase 3: 현장/팀 관리 API 연결 (우선순위 3)

**목표**: 설정 페이지의 모든 섹션 실제 API 연동

#### Task 3.1: SitesContext API 연동
- [ ] Mock 초기화 제거
- [ ] `useEffect`로 `getSites()` 호출
- [ ] Context 상태와 DB 동기화

#### Task 3.2: 팀 관리 API 연결
- [ ] `TeamManagement` 컴포넌트에 React Query 적용
- [ ] 팀 추가/수정/삭제 API 연결
- [ ] 근로자 수 실시간 표시

#### Task 3.3: 관리자 관리 API 구현
- [ ] `getAdmins()` API 생성 (현재 없음)
- [ ] `createAdmin()`, `updateAdmin()` 구현
- [ ] AdminManagement 컴포넌트 연결

---

### Phase 4: 근로자 관리 API 연결 (우선순위 4)

**목표**: 근로자 목록, 상태 관리 실제 데이터로 전환

#### Task 4.1: WorkersPage API 연동
- [ ] Mock 데이터 제거 (Line 36-62)
- [ ] `useQuery`로 `getWorkers()` 호출
- [ ] 검색/필터/페이지네이션 서버 사이드로 전환
  - 현재: `useMemo`로 클라이언트 필터링
  - 변경: API 파라미터로 필터링

#### Task 4.2: 근로자 CRUD 연결
- [ ] `WorkerAddModal` → `createWorker()` 연결
- [ ] `WorkerDetailModal` → `updateWorker()` 연결
- [ ] 엑셀 업로드 기능 구현
- [ ] 승인대기/차단 상태 변경 API

---

### Phase 5: 출퇴근 현황 API 연결 (우선순위 5)

**목표**: 출퇴근 관리 페이지 실시간 연동

#### Task 5.1: AttendancePage API 연동
- [ ] Mock 데이터 제거
- [ ] `useQuery`로 `getAttendanceRecords()` 호출
- [ ] 날짜/팀 필터링 서버 사이드로

#### Task 5.2: QR 출퇴근 처리
- [ ] `CheckInModal` → `checkInWithQR()` 연결
- [ ] QR 스캐너 컴포넌트 활성화
- [ ] 수동 퇴근 처리 기능

#### Task 5.3: Realtime 통합
- [ ] `useRealtimeAttendance` 훅 활성화
- [ ] 출근 발생 시 목록 자동 갱신
- [ ] 대시보드 KPI 실시간 업데이트

---

### Phase 6: 고도화 (우선순위 6)

#### Task 6.1: React Query 전면 도입
- [ ] API 호출을 모두 커스텀 훅으로 추상화
  - `useWorkers()`, `useSites()`, `useAttendance()` 등
- [ ] Optimistic Update 적용
- [ ] 에러 바운더리 및 Retry 로직

#### Task 6.2: Realtime 확장
- [ ] 근로자 상태 변경 실시간 반영 (승인/차단)
- [ ] 관리자 추가 시 팀 목록 자동 갱신
- [ ] WebSocket 재연결 전략

---

## 6. 기술적 개선 포인트

### 6.1 API 레이어 개선

#### 현재 문제
- API 함수들이 직접 `supabase` 클라이언트 호출
- 에러 처리가 일관적이지 않음
- 로딩 상태 관리가 각 컴포넌트에 분산

#### 개선 방안
```typescript
// 예시: hooks/useWorkers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkers, createWorker } from '@/api/workers';

export function useWorkers(options) {
  return useQuery({
    queryKey: ['workers', options],
    queryFn: () => getWorkers(options),
    staleTime: 1000 * 60 * 5, // 5분 캐시
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
```

### 6.2 타입 안전성 강화

#### 현재 상황
- Supabase 생성 타입 (`types/supabase.ts`)과 공유 패키지 타입 불일치
- 일부 컴포넌트가 로컬 인터페이스 정의

#### 개선 방안
1. `@tong-pass/shared` 타입을 단일 진실의 원천(Single Source of Truth)으로
2. Supabase 타입을 공유 타입으로 매핑하는 어댑터 함수 생성
3. Zod로 런타임 검증 추가

---

## 7. 다음 단계 액션 플랜

### 즉시 착수 (이번 주)

1. **온보딩 플로우 수정**
   - `signup` Edge Function에 모든 필드 저장
   - 회원가입 후 `user.siteId` 확인

2. **대시보드 API 연결**
   - Mock 데이터 제거
   - `getDashboardSummary()` 정상 작동 확인

3. **SitesContext API 연동**
   - 초기화 시 `getSites()` 호출

### 이번 달 목표

4. **근로자 관리 API 연결**
   - WorkersPage Mock 제거
   - CRUD 모달 연결

5. **출퇴근 현황 API 연결**
   - AttendancePage Mock 제거
   - Realtime 통합

6. **React Query 도입**
   - 주요 페이지에 `useQuery` 적용

---

## 8. 환경 변수 확인

### 필수 환경 변수 (.env.local)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**현재 상태**: ✅ 설정됨 (`apps/admin-web/.env.local` 존재)

---

## 9. 결론

### 현재 상태
- **인증**: ✅ 완전히 작동
- **현장/팀 관리**: 🟡 API는 있으나 Context가 목업 사용
- **근로자/출퇴근**: 🔴 완전히 목업 데이터
- **대시보드**: 🟡 API 호출 로직 있으나 폴백이 목업

### 핵심 문제
1. **온보딩 데이터가 DB에 저장되지 않음** → `user.siteId` null
2. **Context와 페이지가 Mock 데이터로 초기화됨** → API 미호출
3. **React Query 미사용** → 캐싱/동기화 수동 관리

### 해결 방향
1. **Phase 1**: 온보딩 DB 저장 → `user.siteId` 보장
2. **Phase 2-3**: Context/페이지 API 연결 → Mock 제거
3. **Phase 4-5**: 근로자/출퇴근 실제 데이터 연동
4. **Phase 6**: React Query + Realtime 고도화

**예상 소요 시간**: Phase 1-3 약 1주, Phase 4-5 약 1주, Phase 6 약 3일
