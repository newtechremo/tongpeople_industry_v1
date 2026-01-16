# 작업 로그 - 2026-01-15

## 디자인 시스템 구현

### 개요
모바일 앱(worker-mobile)의 디자인 시스템을 코드로 구현했습니다.
레퍼런스 앱의 입력 필드 상태별 색상 정의와 오렌지 배경 헤더 스타일을 적용했습니다.

---

## 생성된 파일

### 테마/토큰 (4개)
| 파일 | 설명 |
|------|------|
| `src/theme/colors.ts` | 색상 상수 (Primary, Input 상태, Header, TabBar) |
| `src/theme/typography.ts` | 폰트, 텍스트 스타일 |
| `src/theme/spacing.ts` | 간격, 컴포넌트 크기, 라운딩 |
| `src/theme/index.ts` | 통합 export |

### UI 컴포넌트 (8개)
| 파일 | 설명 |
|------|------|
| `src/components/ui/Button.tsx` | Primary, Secondary, Ghost, Danger (4종) |
| `src/components/ui/Input.tsx` | 6가지 상태 지원 (입력전/중/후/불가/에러/성공) |
| `src/components/ui/Card.tsx` | Card, PressableCard |
| `src/components/ui/Checkbox.tsx` | Checkbox, CheckAll |
| `src/components/ui/Radio.tsx` | Radio, RadioGroup |
| `src/components/ui/Select.tsx` | 드롭다운 + BottomSheet |
| `src/components/ui/Toast.tsx` | 토스트 + useToast 훅 |
| `src/components/ui/Modal.tsx` | Modal, AlertModal, BackExitWarning |

### 레이아웃 컴포넌트 (4개)
| 파일 | 설명 |
|------|------|
| `src/components/layout/Header.tsx` | 오렌지 배경 헤더 (solid/gradient/transparent/white) |
| `src/components/layout/ScreenWrapper.tsx` | SafeArea 래퍼, BottomAction |
| `src/components/layout/TabBar.tsx` | 하단 탭바 |
| `src/components/layout/index.ts` | 배럴 export |

---

## 수정된 파일

### tailwind.config.js
- 입력 필드 상태별 색상 추가 (border, bg, text)
- 헤더/탭 색상 추가
- 컴포넌트 높이 (input, button, header, tabbar)
- 라운딩 (input, button, card, modal)

### design-system-mobile.md
- 입력 필드 6단계 상태 상세 문서화
- 헤더 색상 및 변형(variants) 문서화
- 섹션 12: 컴포넌트 구현 및 사용 예시 추가

---

## 핵심 디자인 결정

| 항목 | 값 |
|------|-----|
| 입력 필드 상태 | 6단계 (Default, Focused, Filled, Disabled, Error, Success) |
| 헤더 배경 | `#F97316` (Orange 500) |
| 헤더 텍스트 | `#FFFFFF` (White) |
| 라운딩 | 12px 유지 (rounded-xl) |
| 폰트 | Pretendard |

---

## 입력 필드 상태별 색상

| 상태 | 테두리 | 배경 | 텍스트 |
|------|--------|------|--------|
| Default | `#CBD5E1` | `#FFFFFF` | placeholder: `#94A3B8` |
| Focused | `#F97316` (2px) | `#FFFFFF` | `#1E293B` |
| Filled | `#CBD5E1` | `#FFFFFF` | `#1E293B` |
| Disabled | `#E2E8F0` | `#F1F5F9` | `#94A3B8` |
| Error | `#DC2626` (2px) | `#FFFFFF` | `#1E293B` |
| Success | `#16A34A` | `#FFFFFF` | `#1E293B` |

---

## 참고
- 레퍼런스: `C:\hongtong\reference\figma\새 폴더\`
- 계획서: `.sisyphus/plans/design-system-implementation-plan.md`

---

# 모바일-PC 통합 구현 (Phase 1-6)

## 개요
모바일 앱(worker-mobile)과 PC 관리자(admin-web) 간의 기능 통합을 완료했습니다.
주요 기능: 가입 플로우, QR 출근/퇴근, 실시간 동기화

---

## Phase 1: DB 스키마 및 타입 정리

### WorkerStatus 타입 확장 (3개 → 5개)
```typescript
// packages/shared/src/types/index.ts
export type WorkerStatus =
  | 'PENDING'     // 관리자 선등록 후 동의 대기
  | 'REQUESTED'   // 근로자 직접 가입 후 승인 대기
  | 'ACTIVE'      // 활성
  | 'INACTIVE'    // 비활성 (퇴사 등)
  | 'BLOCKED';    // 관리자 차단
```

### DB 마이그레이션
| 파일 | 설명 |
|------|------|
| `00007_add_user_status.sql` | users 테이블에 status 필드 추가 |
| `00008_status_update_policy.sql` | status 변경 권한 제어 트리거 |

---

## Phase 2: 모바일 인증 및 가입

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `src/lib/supabase.ts` | Supabase 클라이언트 (AsyncStorage) |
| `src/context/AuthContext.tsx` | 인증 컨텍스트 + useAuth 훅 |
| `src/api/auth.ts` | 로그인/가입/회사코드 API |
| `app/(auth)/_layout.tsx` | 인증 플로우 레이아웃 |
| `app/(auth)/login.tsx` | 로그인 화면 |
| `app/(auth)/company-code.tsx` | 회사코드 입력 화면 |
| `app/(auth)/signup.tsx` | 정보 입력 화면 |
| `app/pending.tsx` | 승인 대기 화면 |
| `app/blocked.tsx` | 차단 안내 화면 |

### 상태 기반 라우팅
- 미로그인 → `/(auth)/login`
- PENDING/REQUESTED → `/pending`
- BLOCKED/INACTIVE → `/blocked`
- ACTIVE → 메인 화면

---

## Phase 3: API 연동

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `src/api/attendance.ts` | 출퇴근 기록 API |

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `app/history.tsx` | 임시 데이터 → Supabase API 연동 |

---

## Phase 4: QR 보안 강화

### QR 서명 시스템
- **클라이언트**: HMAC-SHA256 서명 생성 (`expo-crypto`)
- **서버**: 서명 검증 후 출근 처리
- **만료 시간**: 30초

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `src/utils/qrSigner.ts` | QR 서명 생성 유틸 |

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `app/qr.tsx` | 서명된 QR 생성 적용 |
| `backend/supabase/functions/check-in/index.ts` | 서명 검증 + 상태 확인 추가 |

---

## Phase 5: 실시간 동기화

### 모바일 훅
| 파일 | 설명 |
|------|------|
| `src/hooks/useStatusMonitor.ts` | 상태 변경 감지 (승인/차단) |

### PC 관리자 훅
| 파일 | 설명 |
|------|------|
| `src/hooks/useRealtimeAttendance.ts` | 출퇴근 변경 → 캐시 무효화 |

### 동작
- 관리자 승인 → 모바일 실시간 화면 전환
- 관리자 차단 → 모바일 강제 로그아웃
- QR 출근 → 대시보드 실시간 갱신

---

## Phase 6: PC QR 스캐너

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `src/components/attendance/QRScanner.tsx` | html5-qrcode 기반 스캐너 |
| `src/components/attendance/CheckInModal.tsx` | 출근 처리 모달 |
| `src/components/attendance/index.ts` | 배럴 export |

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/api/attendance.ts` | `checkInWithQR` 함수 추가 |

---

## 의존성 설치

### 모바일 (worker-mobile)
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill expo-crypto
```

### PC 관리자 (admin-web)
```bash
pnpm add html5-qrcode
```

---

## 환경변수 설정

### 모바일 (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_QR_SECRET_KEY=랜덤32바이트키
```

### Supabase
```bash
supabase secrets set QR_SECRET_KEY="동일한_랜덤32바이트키"
supabase db push  # 마이그레이션 적용
```

---

## Git 커밋 이력

| 커밋 | 내용 |
|------|------|
| `bce88e8` | feat: 모바일-PC 통합 Phase 1-2 구현 |
| `81b33a4` | feat: 모바일-PC 통합 Phase 3-5 구현 |
| `503f20a` | feat: 모바일-PC 통합 Phase 6 구현 - PC QR 스캐너 |

---

## 계획 문서
- `.sisyphus/plans/mobile-pc-integration-plan.md`
