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
