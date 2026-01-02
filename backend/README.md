# Backend - Supabase

산업현장통 백엔드 (Supabase)

## 구조

```
backend/
└── supabase/
    ├── config.toml           # 로컬 개발 설정
    ├── migrations/           # DB 스키마
    │   ├── 00001_create_tables.sql   # 테이블 생성
    │   └── 00002_rls_policies.sql    # RLS 정책
    ├── functions/            # Edge Functions
    │   ├── check-in/         # 출근 처리 API
    │   └── check-out/        # 퇴근 처리 API
    └── seed/                 # 테스트 데이터
        └── seed.sql
```

## 로컬 개발 환경 설정

### 1. Supabase CLI 설치

```bash
# macOS
brew install supabase/tap/supabase

# Windows (scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# npm
npm install -g supabase
```

### 2. 로컬 Supabase 시작

```bash
cd backend/supabase
supabase start
```

### 3. 마이그레이션 실행

```bash
supabase db reset  # 모든 마이그레이션 + seed 실행
```

### 4. Edge Functions 실행

```bash
supabase functions serve
```

## 테이블 구조

| 테이블 | 설명 |
|--------|------|
| `companies` | 회사 (서비스 이용 업체) |
| `sites` | 현장 (퇴근 정책, 근무일 기준 설정) |
| `partners` | 협력업체 |
| `users` | 사용자 (Supabase Auth 연동) |
| `attendance` | 출퇴근 기록 |

## API 엔드포인트

### POST /functions/v1/check-in

출근 처리

```json
{
  "site_id": 1,
  "qr_payload": {
    "workerId": "uuid",
    "timestamp": 1703123456789,
    "expiresAt": 1703123486789
  }
}
```

### POST /functions/v1/check-out

퇴근 처리

```json
{
  "site_id": 1,
  "user_id": "uuid"
}
```

## 프로덕션 배포

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 프로젝트 생성
2. 프로젝트 연결:
   ```bash
   supabase link --project-ref <project-id>
   ```
3. 마이그레이션 배포:
   ```bash
   supabase db push
   ```
4. Edge Functions 배포:
   ```bash
   supabase functions deploy check-in
   supabase functions deploy check-out
   ```
