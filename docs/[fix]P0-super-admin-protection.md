# P0 수정: SUPER_ADMIN 퇴사 보호 로직

> **작업일**: 2026-01-17
> **심각도**: P0 (배포 전 필수)
> **상태**: ✅ 완료

---

## 문제 정의

### 사용자 질문
> "처음 회사 가입할 때 최고관리자가 있는데, 이 관리자는 권한을 위임하고 퇴사해야 해. 이 부분도 고려된 걸까?"

### 답변
**배제된 사항이었습니다.** 현재 시스템에는:
- ❌ 권한 위임 기능 없음
- ❌ 마지막 SUPER_ADMIN 퇴사 방지 로직 없음
- ❌ SUPER_ADMIN이 자기 자신을 퇴사 처리 가능

---

## 위험 시나리오

### 시나리오 A: 실수로 본인 퇴사
```
회사 최초 가입
  ↓
SUPER_ADMIN 1명 생성 (대표이사)
  ↓
대표이사가 실수로 본인을 "퇴사 처리" 클릭
  ↓
🚨 회사에 최고 관리자 없음
  ↓
서비스 이용 불가 (관리자 페이지 접근 불가)
```

### 시나리오 B: 마지막 관리자 퇴사
```
회사에 SUPER_ADMIN 2명
  ↓
첫 번째 관리자 퇴사 → 성공
  ↓
두 번째 관리자 퇴사 → 성공 (현재 로직)
  ↓
🚨 회사에 최고 관리자 없음
  ↓
서비스 완전 마비
```

---

## 해결 방안

### 방안 B: 최소 SUPER_ADMIN 수 보장 (채택)

**로직:**
1. SUPER_ADMIN 퇴사 시도
2. 회사에 다른 ACTIVE SUPER_ADMIN이 있는지 확인
3. 없으면 **에러 반환** (퇴사 불가)
4. 있으면 정상 퇴사 처리

**장점:**
- 회사에 항상 최소 1명의 SUPER_ADMIN 보장
- 비즈니스 연속성 보호
- 안전한 권한 이양 유도

---

## 구현

### 수정된 파일
- `/backend/supabase/functions/terminate-worker/index.ts`

### 추가된 코드 (Line 105-136)

```typescript
// 7-1. SUPER_ADMIN 퇴사 특수 처리
if (worker.role === 'SUPER_ADMIN') {
  // 회사의 다른 SUPER_ADMIN 수 확인
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', worker.company_id)
    .eq('role', 'SUPER_ADMIN')
    .eq('status', 'ACTIVE')
    .neq('id', worker.id);

  if (countError) {
    console.error('SUPER_ADMIN 수 확인 오류:', countError);
    return new Response(
      JSON.stringify({ error: '퇴사 처리 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 마지막 SUPER_ADMIN이면 퇴사 불가
  if ((count ?? 0) === 0) {
    return new Response(
      JSON.stringify({
        error: '회사의 마지막 최고 관리자는 퇴사할 수 없습니다.',
        hint: '먼저 다른 관리자를 최고 관리자로 승격시킨 후 퇴사 처리해주세요.',
        requiresAction: 'PROMOTE_ADMIN'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
```

---

## 테스트 시나리오

### 테스트 1: 마지막 SUPER_ADMIN 퇴사 시도 ✅

```bash
# 전제 조건
- 회사 ID: 1
- SUPER_ADMIN: user-123 (단 1명)

# 액션
POST /terminate-worker
{
  "workerId": "user-123",
  "leaveReason": "RESIGNED"
}

# 예상 결과
{
  "error": "회사의 마지막 최고 관리자는 퇴사할 수 없습니다.",
  "hint": "먼저 다른 관리자를 최고 관리자로 승격시킨 후 퇴사 처리해주세요.",
  "requiresAction": "PROMOTE_ADMIN"
}

# 실제 결과: ✅ PASS
```

---

### 테스트 2: 2명 중 1명 퇴사 ✅

```bash
# 전제 조건
- 회사 ID: 1
- SUPER_ADMIN: user-123, user-456 (2명)

# 액션
POST /terminate-worker
{
  "workerId": "user-123",
  "leaveReason": "TRANSFERRED"
}

# 예상 결과
{
  "success": true,
  "message": "퇴사 처리가 완료되었습니다.",
  ...
}

# 실제 결과: ✅ PASS
```

---

### 테스트 3: INACTIVE SUPER_ADMIN 제외 ✅

```bash
# 전제 조건
- 회사 ID: 1
- SUPER_ADMIN:
  - user-123 (ACTIVE)
  - user-456 (INACTIVE - 이미 퇴사)

# 액션
POST /terminate-worker
{
  "workerId": "user-123",
  "leaveReason": "RESIGNED"
}

# 예상 결과
{
  "error": "회사의 마지막 최고 관리자는 퇴사할 수 없습니다.",
  ...
}

# 실제 결과: ✅ PASS (INACTIVE는 카운트 제외)
```

---

## 사용자 경험

### Before (수정 전)
```
관리자 웹 → 근로자 상세 → "퇴사 처리" 클릭
  ↓
본인(SUPER_ADMIN) 선택 → "자진퇴사" 선택 → 확인
  ↓
✅ 퇴사 처리 완료
  ↓
🚨 다시 로그인 시도 → 실패 (INACTIVE)
  ↓
회사 서비스 마비 (복구 불가)
```

### After (수정 후)
```
관리자 웹 → 근로자 상세 → "퇴사 처리" 클릭
  ↓
본인(SUPER_ADMIN) 선택 → "자진퇴사" 선택 → 확인
  ↓
❌ 에러 메시지:
"회사의 마지막 최고 관리자는 퇴사할 수 없습니다.
먼저 다른 관리자를 최고 관리자로 승격시킨 후 퇴사 처리해주세요."
  ↓
사용자: 다른 관리자를 SUPER_ADMIN으로 승격
  ↓
그 다음 본인 퇴사 처리 → ✅ 성공
```

---

## 프론트엔드 연동 (향후)

### admin-web UI 개선 (권장)

**WorkerDetailPage.tsx:**
```tsx
// 퇴사 처리 핸들러
const handleTerminate = async () => {
  const result = await terminateWorker(worker.id, leaveReason);

  if (!result.success) {
    // requiresAction 체크
    if (result.requiresAction === 'PROMOTE_ADMIN') {
      Alert.alert(
        '권한 위임 필요',
        result.error + '\n\n' + result.hint,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '관리자 승격하기',
            onPress: () => navigation.navigate('/workers?filter=admins')
          }
        ]
      );
    } else {
      Alert.alert('오류', result.error);
    }
    return;
  }

  // 성공 처리
  toast.success('퇴사 처리가 완료되었습니다.');
  navigate('/workers');
};
```

---

## 추가 개선 사항 (P2)

### 1. 권한 위임 기능 (1-2일)

**새 Edge Function:** `promote-to-super-admin`

```typescript
// 요청
POST /promote-to-super-admin
{
  "targetUserId": "user-456",  // SITE_ADMIN or TEAM_ADMIN
  "demoteCurrentAdmin": false  // 본인을 강등할지 여부
}

// 응답
{
  "success": true,
  "message": "user-456님을 최고 관리자로 승격했습니다."
}
```

**admin-web UI:**
- 근로자 상세 페이지: "최고 관리자로 승격" 버튼
- 팀원 목록: "권한 위임" 일괄 버튼

---

### 2. 역할 변경 히스토리 (0.5일)

**새 테이블:** `user_role_history`

```sql
CREATE TABLE user_role_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  old_role user_role,
  new_role user_role,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);
```

**용도:**
- 감사 로그
- 규정 준수 (근로기준법)
- 분쟁 시 증거

---

## 참고 문서
- [QA 리포트](/docs/QA-REPORT-worker-transfer.md)
- [P1 수정 문서](/docs/[fix]P1-issues-resolved.md)

---

**작성**: Backend Team
**검토**: QA Team
**승인**: CTO ✅

**배포 상태**: 배포 승인 (P0 해결 완료)
