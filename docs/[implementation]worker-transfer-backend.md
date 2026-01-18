# 근로자 이직 시스템 백엔드 구현 완료 (방안 1)

> **구현일**: 2026-01-17
> **전략**: 메인 테이블(users) + 이력 테이블(user_employment_history)
> **상태**: 완료

---

## 구현 파일 목록

### 1. DB 마이그레이션
**파일**: `/backend/supabase/migrations/00013_add_employment_history.sql`

**주요 기능**:
- `leave_reason` ENUM 타입 정의 (`RESIGNED`, `TRANSFERRED`, `FIRED`)
- `user_employment_history` 테이블 생성
- 자동 이력 저장 트리거 함수 (`save_employment_history`)
- `users.status` → `INACTIVE` 변경 시 자동 실행되는 트리거

**테이블 스키마**:
```sql
CREATE TABLE user_employment_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id BIGINT NOT NULL,
  site_id BIGINT NOT NULL,
  partner_id BIGINT NOT NULL,
  role user_role NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ NOT NULL,
  leave_reason leave_reason,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);
```

---

### 2. 퇴사 처리 함수
**파일**: `/backend/supabase/functions/terminate-worker/index.ts`

**API 엔드포인트**: `POST /terminate-worker`

**요청 형식**:
```json
{
  "workerId": "uuid",
  "leaveReason": "RESIGNED" | "TRANSFERRED" | "FIRED"
}
```

**응답 형식**:
```json
{
  "success": true,
  "message": "퇴사 처리가 완료되었습니다.",
  "data": {
    "workerId": "uuid",
    "name": "홍길동",
    "phone": "01012345678",
    "leaveReason": "RESIGNED",
    "leftAt": "2026-01-17T10:00:00Z"
  }
}
```

**권한 체크**:
- `SUPER_ADMIN`: 모든 회사 근로자 퇴사 처리 가능
- `SITE_ADMIN`: 같은 회사 + 같은 현장 근로자만
- `TEAM_ADMIN`: 같은 회사 + 같은 현장 + 같은 팀 근로자만

**처리 로직**:
1. JWT 토큰 검증 및 관리자 정보 조회
2. 권한 확인 (SUPER_ADMIN, SITE_ADMIN, TEAM_ADMIN)
3. 대상 근로자 조회 및 권한별 접근 제어
4. `users.status` → `INACTIVE` 업데이트
5. 트리거가 자동으로 `user_employment_history`에 이력 저장
6. `leave_reason`과 `created_by` 업데이트

---

### 3. 가입 함수 수정
**파일**: `/backend/supabase/functions/register-worker/index.ts`

**변경 내용**: 기존 유저 검사 로직에 INACTIVE 처리 추가

**INACTIVE 사용자 처리**:

#### Case 1: 같은 회사 복귀
```typescript
if (existingUser.company_id === data.companyId) {
  // status → ACTIVE, 소속 정보 업데이트
  return { status: 'ACTIVE', isReactivated: true };
}
```

#### Case 2: 다른 회사로 이직
```typescript
else {
  // 새 회사 정보로 업데이트, status → REQUESTED (승인 필요)
  return {
    status: 'REQUESTED',
    isTransferred: true,
    previousCompany: '이전 회사'
  };
}
```

**응답 예시** (이직):
```json
{
  "success": true,
  "message": "새 회사로 가입 신청되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.",
  "data": {
    "userId": "uuid",
    "status": "REQUESTED",
    "isTransferred": true,
    "previousCompany": "A회사"
  }
}
```

---

### 4. SMS 인증 함수 수정
**파일**: `/backend/supabase/functions/verify-sms/index.ts`

**변경 내용**: 인증 성공 시 INACTIVE 사용자 정보 반환

**응답 형식**:
```json
{
  "success": true,
  "message": "인증이 완료되었습니다.",
  "verificationToken": "base64token",
  "existingUser": {
    "id": "uuid",
    "status": "INACTIVE",
    "companyName": "이전 회사"
  }
}
```

**클라이언트 활용**:
- `existingUser`가 있으면 "이전 회사에서 퇴사하셨군요. 새 회사로 가입하시겠습니까?" 안내
- 없으면 일반 신규 가입 플로우

---

## 데이터 흐름

### 시나리오 1: 근로자 퇴사
```
관리자 웹 → terminate-worker API
  ↓
users.status → INACTIVE 업데이트
  ↓
트리거 자동 실행
  ↓
user_employment_history에 이력 저장
  ↓
leave_reason, created_by 업데이트
```

### 시나리오 2: 같은 회사 복귀
```
근로자 앱 → verify-sms (INACTIVE 감지)
  ↓
register-worker 호출
  ↓
company_id 동일 확인
  ↓
status → ACTIVE (즉시 복귀)
  ↓
소속 정보(site_id, partner_id) 업데이트
```

### 시나리오 3: 다른 회사 이직
```
근로자 앱 → verify-sms (INACTIVE 감지, 이전 회사명 표시)
  ↓
register-worker 호출
  ↓
company_id 다름 확인
  ↓
status → REQUESTED (승인 대기)
  ↓
새 회사 정보로 업데이트
  ↓
관리자 승인 후 ACTIVE
```

---

## 상태 전이 다이어그램

```
ACTIVE (A회사)
  ↓ (관리자 퇴사 처리)
INACTIVE
  ├─→ (같은 회사 재가입) → ACTIVE
  └─→ (다른 회사 가입) → REQUESTED → (승인) → ACTIVE
```

---

## RLS 정책 권장사항

**user_employment_history 테이블**:
```sql
-- 관리자: 자신의 회사 이력 조회
CREATE POLICY "관리자는 자신의 회사 이력 조회 가능"
ON user_employment_history FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  )
);

-- 근로자: 자신의 이력만 조회
CREATE POLICY "근로자는 자신의 이력만 조회 가능"
ON user_employment_history FOR SELECT
USING (user_id = auth.uid());
```

---

## 마이그레이션 실행 방법

### 로컬 개발 환경
```bash
# Supabase CLI 사용
supabase db reset  # 전체 초기화 + 마이그레이션
# 또는
supabase migration up  # 새 마이그레이션만 실행
```

### 프로덕션 환경
```bash
# Supabase Dashboard에서 SQL Editor로 실행
# 또는 CLI로 프로덕션 연결 후 실행
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

---

## 테스트 시나리오

### 1. 퇴사 처리 테스트
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/terminate-worker \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "worker-uuid",
    "leaveReason": "RESIGNED"
  }'
```

**검증**:
- `users` 테이블: `status = 'INACTIVE'`
- `user_employment_history` 테이블: 새 레코드 생성됨
- `leave_reason = 'RESIGNED'`

### 2. 같은 회사 복귀 테스트
```bash
# 1단계: SMS 인증
curl -X POST .../verify-sms \
  -d '{"phone":"01012345678","code":"123456","purpose":"SIGNUP"}'

# 응답:
# { "existingUser": { "status": "INACTIVE", "companyName": "A회사" } }

# 2단계: 가입 (같은 company_id)
curl -X POST .../register-worker \
  -d '{
    "verificationToken": "...",
    "companyId": 1,  # 동일한 회사
    "siteId": 2,
    "partnerId": 3,
    ...
  }'

# 응답:
# { "status": "ACTIVE", "isReactivated": true }
```

**검증**:
- `users.status = 'ACTIVE'`
- `users.site_id, partner_id` 업데이트됨

### 3. 다른 회사 이직 테스트
```bash
# 2단계: 가입 (다른 company_id)
curl -X POST .../register-worker \
  -d '{
    "companyId": 2,  # 다른 회사
    ...
  }'

# 응답:
# {
#   "status": "REQUESTED",
#   "isTransferred": true,
#   "previousCompany": "A회사"
# }
```

**검증**:
- `users.status = 'REQUESTED'`
- `users.company_id = 2` (새 회사)
- 관리자 승인 대기

---

## 향후 확장 계획

### 단기 (1-3개월)
- [ ] 관리자 웹에서 이력 조회 UI 구현
- [ ] 퇴사 처리 UI (퇴사 사유 선택)
- [ ] 이직 알림 기능 (Realtime)

### 중기 (6개월)
- [ ] 이력 데이터 분석 대시보드
- [ ] 평균 근속 기간, 이직률 통계
- [ ] 파견 근로자 요청 추적

### 장기 (1년+)
- [ ] 파견 근로자 지원 필요 시 방안 2로 마이그레이션
  - `persons` 테이블 분리
  - `user_memberships` 테이블 생성
  - 다중 소속 지원

---

## 참고 문서
- `/docs/[sisyphus-plan]worker-transfer-strategy.md` - 전략 분석
- `/CLAUDE.md` - 프로젝트 가이드
- `/docs/signin/통패스_근로자앱_가입_PRD.md` - 가입 플로우

---

**구현자**: Claude (AI Assistant)
**검토 필요**: Backend Lead, PM
