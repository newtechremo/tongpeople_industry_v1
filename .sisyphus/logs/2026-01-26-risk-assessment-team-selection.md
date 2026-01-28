# 위험성평가 소속 항목 팀 선택 기능 추가

**작업일**: 2026-01-26
**브랜치**: feature/14-risk-assessment-ui-improvements
**작업자**: Claude Code

## 작업 개요

위험성평가 최초 만들기와 상세보기 페이지에서 "소속회사" 항목을 "소속"으로 변경하고,
회사는 고정으로 표시하며 팀(업체)을 드롭다운으로 선택할 수 있는 기능을 추가했습니다.

## 주요 변경사항

### 1. 팀(업체) Mock 데이터 생성

**파일**: `apps/admin-web/src/mocks/teams.ts` (신규)

#### 데이터 구조
```typescript
interface Team {
  id: string;
  name: string;
  companyId: string;
  siteId?: string;
  type: 'CONTRACTOR' | 'SUBCONTRACTOR' | 'PARTNER';
  contactPerson?: string;
  contactPhone?: string;
  businessNumber?: string;
  isActive: boolean;
}
```

#### Mock 팀 목록
- **(주)정이앤지** - 원도급사
- **협력업체A** - 하도급사
- **협력업체B** - 하도급사
- **(주)대한건설** - 협력업체
- **한국안전산업** - 협력업체
- **비활성업체** - 비활성 상태 (목록에 표시 안 됨)

#### 유틸 함수
- `getActiveTeams()` - 활성화된 팀 목록 반환
- `getTeamById(id)` - ID로 팀 찾기
- `getTeamsByCompanyId(companyId)` - 회사별 팀 목록
- `getTeamsBySiteId(siteId)` - 현장별 팀 목록

### 2. BasicInfoSection 컴포넌트 수정

**파일**: `apps/admin-web/src/pages/risk-assessment/components/BasicInfoSection.tsx`

#### Props 변경사항

**제거된 Props**
- `teamName?: string` - 기존 업체명 표시용

**추가된 Props**
```typescript
interface Team {
  id: string;
  name: string;
}

interface BasicInfoSectionProps {
  // ... 기존 props
  teamId?: string;              // 선택된 팀 ID
  teams?: Team[];               // 팀 목록
  onTeamChange?: (teamId: string) => void;  // 팀 변경 핸들러
  canChangeTeam?: boolean;      // 팀 변경 가능 여부
}
```

#### UI 변경사항

**Before (기존)**
```
현장명: 통사통사현장
업체: (주)정이앤지
소속 회사: (주)통하는사람들
```

**After (변경 후)**
```
현장명: 통사통사현장
소속:
  회사: (주)통하는사람들
  팀(업체): [드롭다운 선택] ▼
    - 전체 (팀 미지정)
    - (주)정이앤지
    - 협력업체A
    - 협력업체B
    - (주)대한건설
    - 한국안전산업
```

#### 팀 선택 드롭다운 구현
```tsx
<select
  value={teamId || 'all'}
  onChange={(e) => onTeamChange(e.target.value)}
  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-base
             focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500
             appearance-none bg-white"
>
  <option value="all">전체 (팀 미지정)</option>
  {teams.map((team) => (
    <option key={team.id} value={team.id}>
      {team.name}
    </option>
  ))}
</select>
```

#### 표시 로직
- **편집 가능 모드** (`canChangeTeam && onTeamChange`): 드롭다운 표시
- **읽기 전용 모드**: 선택된 팀명 또는 "전체 (팀 미지정)" 텍스트 표시

### 3. LegacyInitialAssessmentPage 수정

**파일**: `apps/admin-web/src/pages/risk-assessment/LegacyInitialAssessmentPage.tsx`

#### 추가된 기능
1. **Import 추가**
   ```typescript
   import { getActiveTeams } from '@/mocks/teams';
   ```

2. **State 추가**
   ```typescript
   const [teamId, setTeamId] = useState<string>('all');
   const teams = useMemo(() => getActiveTeams(), []);
   ```

3. **BasicInfoSection Props 추가**
   ```typescript
   <BasicInfoSection
     // ... 기존 props
     teamId={teamId}
     teams={teams}
     onTeamChange={setTeamId}
   />
   ```

### 4. RiskAssessmentDetailPage 수정

**파일**: `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`

#### 추가된 기능
1. **Import 추가**
   ```typescript
   import { getActiveTeams } from '@/mocks/teams';
   ```

2. **State 추가**
   ```typescript
   const [teamId, setTeamId] = useState<string>('all');
   const teams = useMemo(() => getActiveTeams(), []);
   ```

3. **BasicInfoSection Props 변경**
   - `teamName` prop 제거
   - `teamId`, `teams`, `onTeamChange`, `canChangeTeam` props 추가
   ```typescript
   <BasicInfoSection
     // ... 기존 props
     teamId={teamId}
     teams={teams}
     onTeamChange={setTeamId}
     canChangeTeam={canEdit}
   />
   ```

## 기능 설명

### 팀 선택 동작

1. **기본값**: "전체 (팀 미지정)" - `teamId = 'all'`
2. **특정 팀 선택**: 드롭다운에서 팀 선택 시 해당 팀 ID로 변경
3. **문서 범위**:
   - `teamId = 'all'`: 회사 전체 문서
   - `teamId = 특정 ID`: 해당 팀의 문서

### 권한 제어

- **만들기 페이지**: 항상 팀 선택 가능 (`canChangeTeam` 미지정 시 기본값 true)
- **상세보기 페이지**: 편집 모드일 때만 팀 선택 가능 (`canChangeTeam={canEdit}`)
- **읽기 전용**: 드롭다운 대신 선택된 팀명 텍스트로 표시

### 데이터 저장

현재는 컴포넌트 state로만 관리하며, 실제 저장 시 다음 필드가 포함됩니다:
- `teamId`: 선택된 팀 ID 또는 'all'
- `teamName`: 선택된 팀명 (참조용)

## UI/UX 개선사항

### 시각적 개선
- **레이블 변경**: "소속 회사" → "소속"
- **계층 구조**: 회사(고정) + 팀(선택) 2단 구조로 명확화
- **드롭다운 스타일**: 오렌지 테마 적용, ChevronDown 아이콘 추가

### 사용성 개선
- **명확한 기본값**: "전체 (팀 미지정)" 옵션으로 의도 명확화
- **일관된 표시**: 편집/읽기 모드 모두 동일한 구조 유지
- **접근성**: 키보드 네비게이션 지원 (기본 select 사용)

## 향후 확장 가능성

### 백엔드 연동 시
1. **API 연동**
   - `GET /api/teams` - 팀 목록 조회
   - `GET /api/teams/:id` - 특정 팀 조회
   - 현장 필터링: `GET /api/teams?siteId={siteId}`

2. **저장 로직**
   - 위험성평가 생성/수정 시 `team_id` 필드 포함
   - `team_id = null` 또는 빈 문자열: 회사 전체
   - `team_id = UUID`: 특정 팀

3. **권한 검증**
   - 사용자가 해당 팀 접근 권한이 있는지 확인
   - 팀 관리자는 자신의 팀만 선택 가능

### 추가 기능
1. **팀 필터링**: 현장별로 팀 목록 필터링
2. **팀 정보 표시**: 드롭다운에 업체 타입, 연락처 등 추가 정보
3. **최근 사용 팀**: 최근 선택한 팀을 상단에 표시
4. **팀 검색**: 팀이 많을 경우 검색 기능 추가

## 테스트 확인사항

- [x] 팀 목업 데이터 정상 로딩
- [x] 만들기 페이지에서 팀 선택 드롭다운 표시
- [x] 상세보기 페이지에서 편집 모드일 때 드롭다운 표시
- [x] 상세보기 페이지에서 읽기 모드일 때 텍스트 표시
- [x] "전체 (팀 미지정)" 선택 시 정상 동작
- [x] 특정 팀 선택 시 정상 동작
- [x] 드롭다운 스타일 일관성 (오렌지 테마)
- [x] HMR (Hot Module Replacement) 정상 작동

## 기술적 고려사항

### 컴포넌트 설계
- **Props 기반 제어**: `canChangeTeam`으로 편집/읽기 모드 전환
- **선택적 Props**: 팀 관련 props를 선택적으로 처리하여 하위 호환성 유지
- **Memo 최적화**: `useMemo`로 팀 목록 재계산 방지

### 상태 관리
- **로컬 State**: 현재는 각 페이지에서 독립적으로 관리
- **기본값 처리**: `teamId = 'all'`을 명시적 기본값으로 사용
- **동기화**: 향후 URL 파라미터 또는 전역 상태와 동기화 고려

### 접근성
- **Semantic HTML**: 기본 `<select>` 요소 사용으로 스크린 리더 지원
- **키보드 네비게이션**: 방향키, Enter, Escape 기본 지원
- **포커스 관리**: 오렌지 테마 focus ring 적용

---

**작업 완료**: 2026-01-26 오후
**커밋 대상 파일**:
- apps/admin-web/src/mocks/teams.ts (신규)
- apps/admin-web/src/pages/risk-assessment/components/BasicInfoSection.tsx
- apps/admin-web/src/pages/risk-assessment/LegacyInitialAssessmentPage.tsx
- apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx
