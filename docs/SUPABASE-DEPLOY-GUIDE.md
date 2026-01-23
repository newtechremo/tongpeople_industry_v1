# Supabase Edge Functions 배포 가이드

Supabase Edge Functions는 **대시보드에서 직접 코드를 작성/편집하는 기능을 제공하지 않습니다**. CLI를 통해서만 배포할 수 있습니다. 두 가지 배포 방법을 안내해 드립니다.

---

## 방법 1: Supabase CLI 사용 (권장)

### 1단계: Supabase CLI 설치

```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# npm (모든 플랫폼)
npm install -g supabase

# 또는 npx로 직접 실행 (설치 없이)
npx supabase --version
```

### 2단계: Supabase 프로젝트 연결

```bash
# 프로젝트 폴더로 이동
cd backend/supabase

# Supabase 로그인
supabase login

# 프로젝트 연결 (Project Reference ID 필요)
supabase link --project-ref <your-project-ref>
```

> **Project Reference ID 확인 방법:**
> 1. https://supabase.com/dashboard 접속
> 2. 프로젝트 선택
> 3. Settings → General → Reference ID 복사

### 3단계: 환경 변수 설정

Supabase 대시보드에서 Edge Functions 환경 변수를 설정합니다:

1. **대시보드 접속**: https://supabase.com/dashboard
2. **프로젝트 선택** → **Edge Functions** 메뉴
3. **좌측 하단** "Edge Function Secrets" 또는 Settings → Edge Functions
4. **시크릿 추가**:

| 이름 | 설명 | 예시 |
|------|------|------|
| `JWT_SECRET` | JWT 서명용 비밀키 | `your-super-secret-jwt-key-min-32-chars` |
| `NCP_ACCESS_KEY` | 네이버 클라우드 Access Key | (선택) |
| `NCP_SECRET_KEY` | 네이버 클라우드 Secret Key | (선택) |
| `NCP_SMS_SERVICE_ID` | SENS SMS 서비스 ID | (선택) |
| `NCP_SMS_SEND_NUMBER` | SMS 발신번호 | (선택) |

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`는 자동 주입됩니다.

### 4단계: Edge Functions 배포

```bash
# 모든 함수 배포
supabase functions deploy

# 또는 개별 함수 배포
supabase functions deploy verify-company-code
supabase functions deploy send-sms
supabase functions deploy verify-sms
supabase functions deploy register-worker
supabase functions deploy worker-me
supabase functions deploy sites-teams
supabase functions deploy auth-refresh
supabase functions deploy auth-worker-status
```

### 5단계: 배포 확인

```bash
# 함수 목록 확인
supabase functions list

# 함수 로그 확인
supabase functions logs verify-company-code
```

---

## 방법 2: GitHub Actions 자동 배포

GitHub에 코드를 푸시하면 자동으로 배포되도록 설정합니다.

### 1단계: GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에서 추가:

| Secret 이름 | 값 |
|-------------|-----|
| `SUPABASE_ACCESS_TOKEN` | Supabase 대시보드 → Account → Access Tokens에서 생성 |
| `SUPABASE_PROJECT_ID` | 프로젝트 Reference ID |

### 2단계: GitHub Actions 워크플로우 생성

`.github/workflows/deploy-functions.yml` 파일 생성:

```yaml
name: Deploy Supabase Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'backend/supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy Edge Functions
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          cd backend/supabase
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase functions deploy
```

---

## 배포 후 테스트

### API 엔드포인트 형식

```
https://<project-ref>.supabase.co/functions/v1/<function-name>
```

### 테스트 예시 (curl)

```bash
# 회사코드 검증 테스트
curl -X POST \
  'https://<project-ref>.supabase.co/functions/v1/verify-company-code' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  -d '{"companyCode": "ABC123"}'

# SMS 인증코드 요청 테스트
curl -X POST \
  'https://<project-ref>.supabase.co/functions/v1/send-sms' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  -d '{"phone": "01012345678", "purpose": "SIGNUP"}'
```

---

## 대시보드에서 확인할 수 있는 것들

Supabase 대시보드에서는 다음을 확인할 수 있습니다:

### 1. Edge Functions 목록 확인
- 대시보드 → **Edge Functions**
- 배포된 함수 목록, 상태, URL 확인

### 2. 함수 로그 확인
- 함수 선택 → **Logs** 탭
- 실시간 로그 및 에러 확인

### 3. 함수 호출 통계
- 함수 선택 → **Invocations** 탭
- 호출 횟수, 응답 시간, 에러율 확인

### 4. 환경 변수 관리
- Settings → **Edge Functions**
- Secrets 추가/수정/삭제

---

## 프로젝트 구조

배포할 Edge Functions 목록:

```
backend/supabase/functions/
├── _shared/              # 공유 유틸리티 (자동 번들링)
│   ├── cors.ts           # CORS 헤더 처리
│   ├── response.ts       # 응답 헬퍼 함수
│   ├── jwt.ts            # JWT 토큰 생성/검증
│   ├── date.ts           # 날짜 유틸리티
│   └── qr.ts             # QR 페이로드 생성
├── verify-company-code/  # 회사코드 검증
├── send-sms/             # SMS 인증코드 발송
├── verify-sms/           # SMS 인증 확인
├── register-worker/      # 근로자 등록
├── worker-me/            # 내 정보 조회
├── sites-teams/          # 팀 목록 조회
├── auth-refresh/         # 토큰 갱신
└── auth-worker-status/   # 승인 상태 확인
```

---

## 자주 발생하는 문제

### 1. `_shared` 폴더 import 오류

```
Error: Module not found: ../_shared/cors.ts
```

**해결**: Supabase CLI가 `_shared` 폴더를 자동으로 번들링합니다. 경로가 올바른지 확인하세요.

### 2. 환경 변수 누락

```
Error: JWT_SECRET is not defined
```

**해결**: 대시보드 → Settings → Edge Functions → Secrets에서 환경 변수 추가

### 3. CORS 오류

**해결**: 각 함수에서 `handleCors()` 함수가 제대로 호출되는지 확인

---

## 관련 문서

- [Supabase Edge Functions 공식 문서](https://supabase.com/docs/guides/functions)
- [Supabase CLI 레퍼런스](https://supabase.com/docs/reference/cli)
