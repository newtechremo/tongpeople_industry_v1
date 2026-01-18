# API 연동 빠른 시작 가이드

> **현재 브랜치**: `dashboard-api-connection`
> **마지막 업데이트**: 2026-01-16

---

## 현재 상태 한눈에 보기

```
✅ 완료: 인증 (로그인, 회원가입, SMS)
🟡 부분: 대시보드, 현장/팀 관리 (API는 있으나 Mock 사용)
🔴 목업: 근로자 관리, 출퇴근 현황 (완전히 Mock 데이터)
```

---

## 즉시 시작 가능한 작업

### 1단계: 온보딩 플로우 완성 (최우선)

**문제**: 회원가입 후 `user.siteId`가 null → 대시보드 데이터 로드 불가

**해결**:
```bash
# Edge Function 수정
cd backend/supabase/functions/signup

# index.ts 열어서 companies, sites 테이블 생성 로직 추가
# 자세한 코드는 API_CONNECTION_ROADMAP.md 참조
```

**테스트**:
```bash
# 1. 회원가입 진행
# 2. 로그인 후 개발자 도구 콘솔 확인
# 3. user.siteId가 숫자(null 아님)인지 확인
```

---

## 2단계: 대시보드 API 연결

**파일**: `apps/admin-web/src/pages/DashboardPage.tsx`

**변경사항**:
```typescript
// 삭제
const mockCompanyInfo = { ... };

// 추가
useEffect(() => {
  async function loadCompany() {
    if (!user?.companyId) return;
    const company = await getCompanyById(user.companyId);
    setCompanyInfo(company);
  }
  loadCompany();
}, [user?.companyId]);
```

**신규 파일**: `apps/admin-web/src/api/companies.ts`
```typescript
export async function getCompanyById(id: number) {
  const { data, error } = await supabase
    .from('companies')
    .select('*, client_profiles(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
```

---

## 3단계: React Query 설정

### 설치 (이미 설치됨)
```bash
pnpm add @tanstack/react-query
```

### 커스텀 훅 생성
```bash
# 파일 생성
touch apps/admin-web/src/hooks/useWorkers.ts
touch apps/admin-web/src/hooks/usePartners.ts
touch apps/admin-web/src/hooks/useAttendance.ts
```

### 기본 패턴
```typescript
// hooks/useWorkers.ts
import { useQuery } from '@tanstack/react-query';
import { getWorkers } from '@/api/workers';

export function useWorkers(options) {
  return useQuery({
    queryKey: ['workers', options],
    queryFn: () => getWorkers(options),
    staleTime: 1000 * 60 * 5, // 5분 캐시
    enabled: !!options.siteId, // siteId 있을 때만 실행
  });
}
```

---

## 주요 파일 위치

### API 레이어 (이미 완성)
```
apps/admin-web/src/api/
├── auth.ts          ✅ 완료
├── sites.ts         ✅ 완료
├── partners.ts      ✅ 완료
├── workers.ts       ✅ 완료
├── attendance.ts    ✅ 완료
└── companies.ts     🔴 생성 필요
```

### 페이지 (Mock 제거 필요)
```
apps/admin-web/src/pages/
├── DashboardPage.tsx      🟡 부분 연동 (Line 46-50 Mock 제거)
├── WorkersPage.tsx        🔴 완전 Mock (Line 36-62)
├── AttendancePage.tsx     🔴 완전 Mock
└── SettingsPage.tsx       🟡 부분 연동
```

### Context (API 연결 필요)
```
apps/admin-web/src/context/
├── AuthContext.tsx        ✅ 완료
└── SitesContext.tsx       🔴 Mock 초기화 (Line 5-24)
```

---

## 자주 묻는 질문 (FAQ)

### Q1: 왜 대시보드에 "샘플 데이터" 표시가 나오나요?
**A**: `user.siteId`가 null이거나 출퇴근 기록이 없을 때입니다.
- 해결: 1단계 온보딩 플로우 완성 → `user.siteId` 보장
- 테스트 데이터 생성: `seed-workers` Edge Function 실행

### Q2: API는 작동하는데 UI에 반영이 안됩니다.
**A**: Context나 페이지가 Mock 데이터로 초기화되어 있습니다.
- `SitesContext.tsx` Line 5-24 확인
- `WorkersPage.tsx` Line 36-62 확인
- Mock 배열 제거 → `useEffect` + API 호출로 변경

### Q3: React Query를 꼭 사용해야 하나요?
**A**: 필수는 아니지만 강력히 권장합니다.
- 장점: 자동 캐싱, 백그라운드 리페치, 중복 요청 제거
- 대안: `useState` + `useEffect`도 가능 (수동 관리 필요)

### Q4: Realtime은 언제 적용하나요?
**A**: 기본 API 연동 완료 후 적용합니다.
- Week 1-2: API 연동
- Week 3: Realtime 통합
- `useRealtimeAttendance` 훅 이미 준비됨

---

## 체크리스트

### 이번 주 완료 목표
- [ ] 온보딩 플로우 DB 저장 (signup Edge Function)
- [ ] `user.siteId` null 아님 확인
- [ ] 대시보드 회사 정보 API 연결
- [ ] `SitesContext` Mock 제거

### 다음 주 목표
- [ ] React Query 훅 생성 (useWorkers, usePartners)
- [ ] `WorkersPage` Mock 제거
- [ ] 팀 관리 API 연결

### 3주차 목표
- [ ] 출퇴근 현황 API 연결
- [ ] Realtime 구독 활성화
- [ ] 모든 Mock 데이터 제거

---

## 도움말 문서

| 문서 | 용도 |
|------|------|
| `API_INTEGRATION_STATUS.md` | 상세 현황 분석 |
| `API_CONNECTION_ROADMAP.md` | 3주 작업 계획 |
| `CLAUDE.md` | 프로젝트 전체 가이드 |
| `ARCHITECTURE.md` | 기술 아키텍처 |
| `DATABASE.md` | DB 스키마 |

---

## 다음 단계

1. **지금 바로**: `API_CONNECTION_ROADMAP.md` Week 1 Day 1-2 작업 시작
2. **막히면**: 위 FAQ 참조 또는 기존 완성된 API 파일 참고
3. **테스트**: 각 단계마다 브라우저 개발자 도구로 API 호출 확인

**화이팅! 🚀**
