# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**산업현장통 2.0 - 통패스 (TongPass)**

QR 코드 기반 산업현장 출퇴근 관리 서비스. 건설/제조 현장의 실시간 인원 현황, 고령 근로자 관리, 안전 사고 모니터링을 제공한다.

### 서비스 구성
| 앱 | 대상 | 플랫폼 | 주요 기능 |
|----|------|--------|-----------|
| **관리자 웹** | 현장 관리자 | 웹 (React) | 대시보드, QR 스캔, 현장 설정 |
| **근로자 앱** | 현장 근로자 | 모바일 (React Native) | QR 생성, 출퇴근 확인 |

### 핵심 기능
- **동적 QR 출근**: 캡처 방지를 위한 시간 기반 갱신 QR 코드
- **퇴근 모드**: AUTO_8H (자동 8시간) / MANUAL (수동 인증)
- **근무일 사이클**: 당일 04:00 ~ 익일 03:59
- **대시보드**: 총 출근 현황, 고령자(65세+) 비율, 퇴근율, 소속별 인원 분포

## 권한 및 조직 체계

조직의 계층을 **회사 > 현장 > 팀(업체)** 3단계로 고정하여 복잡도를 낮춘다.

### 조직 계층 구조
```
회사 (Company)
└── 현장 (Site)           예: 대전공장, 서울본사
    └── 팀 (Team/Partner)  예: (주)정이앤지, 협력업체A
        └── 근로자 (Worker)
```

### 사용자 역할 (4단계)

| 역할 | 명칭 | 범위 | 주요 권한 |
|------|------|------|-----------|
| **최고 관리자** | 회사/본사 | 회사 전체 | 시스템 전체 설정, 결제 관리, 모든 현장 접근 |
| **현장 관리자** | 현장 소장 | 특정 현장 | 해당 현장의 모든 데이터 관리, 팀/근로자 관리 |
| **팀 관리자** | 업체장/오반장 | 특정 팀 | 자기 팀원들의 출퇴근 QR 스캔, 팀원 조회 |
| **근로자** | 팀원 | 본인 | QR 생성, 본인 출퇴근 인증 및 기록 조회 |

### 권한 매트릭스

| 기능 | 최고 관리자 | 현장 관리자 | 팀 관리자 | 근로자 |
|------|:-----------:|:-----------:|:---------:|:------:|
| 회사 설정/결제 | O | X | X | X |
| 현장 추가/삭제 | O | X | X | X |
| 현장 설정 변경 | O | O | X | X |
| 팀(업체) 관리 | O | O | X | X |
| 전체 대시보드 조회 | O | O (본인 현장) | X | X |
| 팀원 출퇴근 스캔 | O | O | O | X |
| 팀원 목록 조회 | O | O | O (본인 팀) | X |
| QR 코드 생성 | X | X | O | O |
| 본인 출퇴근 조회 | O | O | O | O |

### TypeScript 타입
```typescript
type UserRole = 'SUPER_ADMIN' | 'SITE_ADMIN' | 'TEAM_ADMIN' | 'WORKER';
```

## 모노레포 구조

```
tong-pass/
├── docs/                   # 문서 (PRD, DB 설계, 디자인 가이드)
├── packages/
│   └── shared/             # 공통 타입, 유틸, 상수
│       ├── src/
│       │   ├── types/      # TypeScript 타입 정의
│       │   ├── constants/  # 공통 상수 (퇴근 모드, 역할 등)
│       │   └── utils/      # 공통 유틸 함수
│       └── package.json
├── apps/
│   ├── admin-web/          # 관리자 웹 대시보드
│   │   ├── src/
│   │   └── package.json
│   └── worker-mobile/      # 근로자 모바일 앱
│       ├── src/
│       └── package.json
├── backend/                # API 서버 (Supabase 또는 Node.js)
│   ├── supabase/           # Supabase 설정 (사용 시)
│   └── functions/          # Edge Functions
├── package.json            # 루트 (워크스페이스 설정)
├── pnpm-workspace.yaml     # pnpm 워크스페이스 정의
└── CLAUDE.md
```

### 워크스페이스 설정

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// 루트 package.json
{
  "name": "tong-pass",
  "private": true,
  "scripts": {
    "dev:admin": "pnpm --filter admin-web dev",
    "dev:mobile": "pnpm --filter worker-mobile start",
    "build:admin": "pnpm --filter admin-web build",
    "build:mobile": "pnpm --filter worker-mobile build"
  }
}
```

### 공통 패키지 사용법

```typescript
// apps/admin-web 또는 apps/worker-mobile에서
import { AttendanceRecord, CheckoutPolicy } from '@tong-pass/shared/types';
import { WORK_DAY_START_HOUR } from '@tong-pass/shared/constants';
import { calculateAge, isSenior } from '@tong-pass/shared/utils';
```

## 기술 스택

### 관리자 웹 (admin-web)
- React 19 + TypeScript 5.8
- Vite 6
- Tailwind CSS 3.4
- Recharts 3.6 (차트)
- Lucide React (아이콘)
- date-fns 4.1 (날짜 처리)

### 근로자 모바일 (worker-mobile)
- React Native + Expo
- TypeScript
- NativeWind (Tailwind for RN)
- react-native-qrcode-svg (QR 생성)
- expo-camera (QR 스캔)

### 백엔드
- Supabase (PostgreSQL, Auth, Realtime)
- Edge Functions (Deno)

## 개발 명령어

```bash
# 의존성 설치 (루트에서)
pnpm install

# 개발 서버 실행
pnpm dev:admin          # 관리자 웹 (localhost:5173)
pnpm dev:mobile         # 모바일 앱 (Expo)

# 빌드
pnpm build:admin        # 관리자 웹 프로덕션 빌드
pnpm build:mobile       # 모바일 앱 빌드

# 공통 패키지 빌드 (타입 변경 시)
pnpm --filter @tong-pass/shared build
```

## 디자인 시스템

### 테마: 오렌지 그라데이션
- Primary 그라데이션: `#F97316` → `#EA580C`
- Primary Light: `#FFF7ED` (orange-50)
- 텍스트 기본: `#1E293B` (slate-800)
- 차트 색상: Navy `#2E2E5D`, Orange `#F97316`, Brown `#7D4E4E`

### 주요 패턴
```tsx
// Primary 버튼
className="px-5 py-2.5 rounded-xl font-bold text-white
           bg-gradient-to-r from-orange-500 to-orange-600
           hover:from-orange-600 hover:to-orange-700"

// KPI 카드
className="p-8 rounded-2xl border border-gray-200 bg-white shadow-sm
           transition-all duration-300 hover:shadow-md hover:-translate-y-1"

// 테이블 행 호버
className="hover:bg-orange-50 transition-colors cursor-pointer"

// 사이드바 활성 메뉴
className="bg-orange-50 text-orange-600 shadow-sm"
```

### 페이지 레이아웃
- 레이아웃 컴포넌트가 외부 패딩(`px-6 py-8`)을 제공하므로, 각 페이지에서는 `p-6` 등 추가 패딩 사용 금지
- 페이지 최상위 div는 `space-y-6`만 사용
```tsx
// 올바른 페이지 구조
export default function SomePage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight text-slate-800">페이지 제목</h1>
      </div>
      {/* 콘텐츠 */}
    </div>
  );
}

// 잘못된 예시 (이중 패딩 발생)
<div className="p-6 space-y-6">  // ❌ p-6 사용 금지
```

### 타이포그래피
- 페이지 제목: `text-xl font-black tracking-tight`
- 섹션 제목: `text-lg font-bold text-slate-500 uppercase`
- KPI 값: `text-5xl font-black tracking-tighter`
- 테이블 헤더: `text-sm font-black uppercase tracking-widest`

### Z-Index 계층
| 레이어 | Z-Index |
|--------|---------|
| 사이드바 | 60 |
| 헤더 | 50 |
| 모달 | 50 |
| 컨트롤 바 | 40 |
| 드롭다운 | 100 |

## 데이터베이스 스키마

### 핵심 테이블
- `sites`: 현장 정보 + `checkout_policy` (AUTO_8H/MANUAL), `auto_hours`
- `partners`: 협력업체 정보
- `attendance`: 출퇴근 로그 (work_date, is_senior, is_auto_out, has_accident)

### 주요 필드
- `is_senior`: 65세 이상 여부 (고령자 대시보드용)
- `is_auto_out`: 자동 퇴근 처리 여부
- `has_accident`: 사고 발생 여부

## 배포 가이드

### 참조 문서
| 문서 | 용도 |
|------|------|
| `SKILL_INSTALL_GUIDE.md` | Claude Code 스킬 설치 참조 |
| `TEAM_GUIDE.md` | 팀원용 배포 워크플로우 가이드 |

### 배포 서버 정보
```yaml
호스트: 49.168.236.221
포트: 6201
사용자: finefit-temp
프로젝트 경로: /home/finefit-temp/Desktop/project
```

### 배포 워크플로우
1. **로컬**: `/github-setup` 스킬로 GitHub 업로드
2. **서버 접속**: `ssh -p 6201 finefit-temp@49.168.236.221`
3. **서버**: `/server-setup` 스킬로 프로젝트 설정
4. **서버**: `/deploy` 스킬로 Nginx/SSL 설정

### Claude Code 스킬 경로
| OS | 경로 |
|----|------|
| Windows | `$env:USERPROFILE\.claude\commands\` |
| macOS/Linux | `~/.claude/commands/` |
