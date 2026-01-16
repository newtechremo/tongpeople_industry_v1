# UI 명세서 생성 스킬 계획서

> **생성일**: 2026-01-16
> **상태**: 승인 대기
> **우선순위**: 높음

---

## 1. 개요

### 1.1 목적
레퍼런스 이미지/동영상을 분석하여 컴포넌트 명세서를 자동 생성하는 스킬을 만든다.
**PC(admin-web)와 Mobile(worker-mobile) 두 플랫폼을 모두 지원한다.**

### 1.2 사용 시나리오
```bash
# 모바일 화면
/ui-spec reference/figma/새 폴더/1.로그인.png --platform mobile

# PC 관리자 화면
/ui-spec reference/figma/01. 위험성평가 목록.png --platform pc

# 플랫폼 자동 감지 (이미지 비율/내용 기반)
/ui-spec reference/figma/some-screen.png
```

### 1.3 출력
- 위치: **플랫폼별 분리**
  - PC: `docs/ui-specs/pc/`
  - Mobile: `docs/ui-specs/mobile/`
- 파일명: `{날짜}-{원본파일명}.md` (예: `2026-01-16-로그인.md`)

---

## 2. 확정 사항

| 항목 | 선택 |
|------|------|
| 스킬 위치 | 프로젝트 전용 (`.claude/commands/ui-spec.md`) |
| 출력 위치 | `docs/ui-specs/{pc\|mobile}/` 자동 저장 |
| 파일명 규칙 | 날짜 + 원본파일명 |
| 동영상 처리 | 프레임 캡처 + 상태 전이 다이어그램 |
| 컴포넌트 연결 | 매핑 시도 → 없으면 "🆕 신규 필요" 표시 |
| 플랫폼 지원 | **PC (admin-web) + Mobile (worker-mobile)** |

---

## 2.1 플랫폼별 프로세스

| 플랫폼 | 프로세스 | 출력 |
|--------|----------|------|
| **Mobile** | 레퍼런스 → UI 명세서 | 1개 파일 |
| **PC** | 레퍼런스 → 기획 문서 → 구현 명세서 | 2개 파일 |

### Mobile (1단계)
```
레퍼런스 이미지/동영상
        ↓
   화면 분석
        ↓
  UI 컴포넌트 명세서
```

### PC (2단계)
```
레퍼런스 이미지/동영상
        ↓
   ① 화면 분석
        ↓
    기획 문서 (무엇을 만들지)
        ↓
   ② 컴포넌트 매핑
        ↓
   구현 명세서 (어떻게 만들지)
```

---

## 2.2 플랫폼별 기술 차이

| 항목 | PC (admin-web) | Mobile (worker-mobile) |
|------|----------------|------------------------|
| **기술 스택** | React + Vite + Tailwind | React Native + Expo + NativeWind |
| **컴포넌트 경로** | `apps/admin-web/src/components/` | `apps/worker-mobile/src/components/` |
| **디자인 시스템** | `docs/design_guideline_251221.md` + 기존 코드 | `docs/figma/design-system-mobile.md` |
| **테마 파일** | `apps/admin-web/src/styles/` | `apps/worker-mobile/src/theme/` |
| **레이아웃 패턴** | Sidebar + Header + Content | Header + Content + TabBar |
| **인터랙션** | 마우스 클릭, 호버 | 탭, 스와이프, 길게 누르기 |

---

## 3. 작업 단계

### Phase 1: 스킬 파일 생성

#### Task 1.1: 스킬 프롬프트 작성
**파일**: `.claude/commands/ui-spec.md`

```markdown
# UI 명세서 생성 스킬

## 사용법
/ui-spec <파일경로>

## 동작
1. 파일 읽기 (이미지/동영상)
2. 화면 분석
3. 컴포넌트 명세서 생성
4. docs/ui-specs/에 저장
```

---

### Phase 2: 출력 템플릿 정의

#### Task 2.1: 명세서 템플릿 작성
**파일**: `docs/ui-specs/_template.md`

```markdown
# {화면명}

> 원본: `{파일경로}`
> 생성일: {날짜}
> 플랫폼: {PC/Mobile}

---

## 1. 화면 구성

### 레이아웃 구조
```
┌─────────────────────┐
│      Header         │
├─────────────────────┤
│                     │
│      Content        │
│                     │
├─────────────────────┤
│      Footer         │
└─────────────────────┘
```

### 구성 요소
| 영역 | 컴포넌트 | 설명 |
|------|----------|------|
| Header | BackButton + Title | 뒤로가기, 페이지 제목 |
| Content | Form | 입력 폼 |
| Footer | PrimaryButton | 제출 버튼 |

---

## 2. 인터랙션 패턴

| 트리거 | 동작 | 결과 |
|--------|------|------|
| 버튼 탭 | 폼 제출 | 로딩 → 다음 화면 |
| 뒤로가기 | 네비게이션 | 이전 화면 |

---

## 3. 상태 전이 (동영상인 경우)

```
[초기 상태] → [입력 중] → [제출] → [완료]
     │            │          │
     └── 에러 ────┴── 재시도 ─┘
```

---

## 4. 컴포넌트 매핑

| UI 요소 | 기존 컴포넌트 | 경로 |
|---------|--------------|------|
| 입력 필드 | `<Input />` | `src/components/ui/Input.tsx` |
| 버튼 | `<Button variant="primary" />` | `src/components/ui/Button.tsx` |
| 헤더 | 🆕 신규 필요 | - |

---

## 5. 디자인 시스템 참조

- 색상: `docs/figma/design-system-mobile.md` 섹션 2
- 입력 필드: `docs/figma/design-system-mobile.md` 섹션 4
- 버튼: `docs/figma/design-system-mobile.md` 섹션 5

---

## 6. 구현 노트

### 주의사항
- (분석 중 발견된 특이사항)

### 참고 화면
- (유사한 기존 화면 링크)
```

---

### Phase 3: 스킬 로직 구현

#### Task 3.1: 파일 타입 판별
```
입력 파일 확장자 확인:
- 이미지: .png, .jpg, .jpeg, .gif, .webp
- 동영상: .mp4, .mov, .avi, .webm
```

#### Task 3.2: 이미지 분석 로직
1. Read 도구로 이미지 파일 읽기 (Claude는 이미지 분석 가능)
2. 화면 구성 요소 식별
3. 레이아웃 구조 파악
4. 인터랙션 포인트 추론

#### Task 3.3: 동영상 분석 로직
1. ffmpeg로 주요 프레임 추출 (또는 수동 스크린샷 요청)
2. 각 프레임 순차 분석
3. 상태 전이 흐름 파악
4. 전체 플로우 다이어그램 생성

#### Task 3.4: 컴포넌트 매핑 로직 (플랫폼별)

**PC (admin-web):**
1. `apps/admin-web/src/components/` 폴더 스캔
2. 디자인 시스템: `docs/design_guideline_251221.md` 참조
3. 매핑 결과 또는 "🆕 신규 필요" 표시

**Mobile (worker-mobile):**
1. `apps/worker-mobile/src/components/` 폴더 스캔
2. 디자인 시스템: `docs/figma/design-system-mobile.md` 참조
3. 테마: `apps/worker-mobile/src/theme/` 참조
4. 매핑 결과 또는 "🆕 신규 필요" 표시

#### Task 3.5: 명세서 생성 및 저장
1. 플랫폼에 맞는 템플릿 선택
   - PC: `docs/ui-specs/_template-pc.md`
   - Mobile: `docs/ui-specs/_template-mobile.md`
2. 템플릿에 분석 결과 채우기
3. 플랫폼별 폴더에 저장
   - PC: `docs/ui-specs/pc/{날짜}-{파일명}.md`
   - Mobile: `docs/ui-specs/mobile/{날짜}-{파일명}.md`
4. 결과 요약 출력

---

## 4. 파일 구조

```
tongpeople_industry_v1/
├── .claude/
│   └── commands/
│       └── ui-spec.md                    # 스킬 프롬프트
├── docs/
│   └── ui-specs/
│       ├── _template-pc-plan.md          # PC 기획 문서 템플릿
│       ├── _template-pc-spec.md          # PC 구현 명세서 템플릿
│       ├── _template-mobile.md           # Mobile 명세서 템플릿
│       ├── pc/
│       │   ├── plans/                    # PC 기획 문서
│       │   │   └── 2026-01-16-위험성평가-기획.md
│       │   └── specs/                    # PC 구현 명세서
│       │       └── 2026-01-16-위험성평가-구현.md
│       └── mobile/                       # 모바일 UI 명세서
│           ├── 2026-01-16-로그인.md
│           └── 2026-01-16-QR출근.md
```

---

## 5. 스킬 프롬프트 상세

```markdown
---
name: ui-spec
description: 레퍼런스 이미지/동영상을 분석하여 UI 명세서 생성 (PC 2단계 / Mobile 1단계)
arguments:
  - name: file_path
    description: 분석할 이미지 또는 동영상 파일 경로
    required: true
  - name: platform
    description: 플랫폼 지정 (pc 또는 mobile). 미지정시 자동 감지
    required: false
  - name: step
    description: PC 전용 - 단계 지정 (plan 또는 spec). 미지정시 plan부터 시작
    required: false
---

# UI 명세서 생성

## 입력
- 파일 경로: $ARGUMENTS.file_path
- 플랫폼: $ARGUMENTS.platform (선택)
- 단계: $ARGUMENTS.step (PC 전용, 선택)

## 플랫폼별 프로세스

### Mobile (1단계)
```
레퍼런스 → UI 명세서
```
하나의 명세서 파일 생성

### PC (2단계)
```
레퍼런스 → ① 기획 문서 → ② 구현 명세서
```
두 개의 파일 순차 생성

---

## 수행 작업

### 1. 파일 확인
- Read 도구로 파일 읽기
- 이미지인지 동영상인지 판별

### 2. 플랫폼 판별
**명시적 지정이 없으면 자동 감지:**
- 이미지 비율: 세로가 길면 Mobile, 가로가 길면 PC
- 화면 요소: Sidebar 있으면 PC, TabBar 있으면 Mobile
- 파일명 힌트: "앱", "mobile" → Mobile / "관리자", "admin" → PC

### 3. 화면 분석
파일을 분석하여 다음을 식별:
- 레이아웃 구조
  - **PC**: Sidebar + Header + Content
  - **Mobile**: Header + Content + TabBar
- UI 컴포넌트 (버튼, 입력, 테이블/리스트 등)
- 인터랙션 포인트
  - **PC**: 클릭, 호버, 드래그
  - **Mobile**: 탭, 스와이프, 길게 누르기

### 4. 동영상인 경우 추가 분석
- 화면 전환 흐름 파악
- 상태 변화 식별 (로딩, 성공, 에러 등)
- 상태 전이 다이어그램 작성

---

## PC 2단계 프로세스

### 단계 1: 기획 문서 생성 (--step plan)

**목적**: "무엇을 만들지" 정의

**포함 내용:**
- 화면 목적 및 사용자 시나리오
- 주요 기능 목록
- 데이터 흐름 (API, 상태 관리)
- 사용자 인터랙션 시나리오
- 비즈니스 로직

**저장 위치**: `docs/ui-specs/pc/plans/{날짜}-{화면명}-기획.md`

**템플릿**: `docs/ui-specs/_template-pc-plan.md`

### 단계 2: 구현 명세서 생성 (--step spec)

**전제조건**: 기획 문서가 먼저 존재해야 함

**목적**: "어떻게 만들지" 정의

**포함 내용:**
- 컴포넌트 구조 (트리)
- 기존 컴포넌트 매핑
  - `apps/admin-web/src/components/` 스캔
  - 디자인 시스템: `docs/design_guideline_251221.md` 참조
- 신규 필요 컴포넌트 (🆕 표시)
- Props 인터페이스
- 스타일링 가이드 (Tailwind 클래스)
- 상태 관리 방식

**저장 위치**: `docs/ui-specs/pc/specs/{날짜}-{화면명}-구현.md`

**템플릿**: `docs/ui-specs/_template-pc-spec.md`

---

## Mobile 1단계 프로세스

### UI 명세서 생성

**포함 내용:**
- 화면 목적
- 레이아웃 구조
- 컴포넌트 매핑
  - `apps/worker-mobile/src/components/` 스캔
  - 디자인 시스템: `docs/figma/design-system-mobile.md` 참조
  - 테마: `apps/worker-mobile/src/theme/`
- 신규 필요 컴포넌트 (🆕 표시)
- 인터랙션 패턴
- 상태 전이 (동영상인 경우)

**저장 위치**: `docs/ui-specs/mobile/{날짜}-{화면명}.md`

**템플릿**: `docs/ui-specs/_template-mobile.md`

---

## 컴포넌트 매핑 규칙

- 유사 컴포넌트 있으면 → 경로 표시
- 없으면 → "🆕 신규 필요" 표시
- 부분 수정 필요 → "⚠️ 수정 필요: {내용}" 표시

---

## 출력

### PC
```
📄 PC UI 문서 생성 완료

[기획 문서]
파일: docs/ui-specs/pc/plans/2026-01-16-위험성평가-기획.md
- 화면 목적: 위험성평가 목록 조회 및 관리
- 주요 기능: 검색, 필터, CRUD

[구현 명세서] (--step spec 실행 시)
파일: docs/ui-specs/pc/specs/2026-01-16-위험성평가-구현.md
- 컴포넌트: 8개 (기존 5개, 신규 3개)
- 🆕 RiskAssessmentTable, FilterPanel, StatusBadge
```

### Mobile
```
📄 Mobile UI 명세서 생성 완료

파일: docs/ui-specs/mobile/2026-01-16-로그인.md
- 화면: 로그인
- 컴포넌트: 4개 (기존 3개, 신규 1개)
- 🆕 PasswordToggle
```
```

---

## 6. 예상 결과물

### 사용 예시 - Mobile

```
사용자: /ui-spec reference/figma/새 폴더/1.로그인.png --platform mobile

Claude:
📄 Mobile UI 명세서 생성 완료

파일: docs/ui-specs/mobile/2026-01-16-로그인.md

## 요약
- 플랫폼: Mobile
- 화면: 로그인 - 비밀번호 입력
- 컴포넌트: 4개 (기존 3개, 신규 1개)

## 컴포넌트 매핑
✅ Input (비밀번호) → src/components/ui/Input.tsx
✅ Button (로그인) → src/components/ui/Button.tsx
✅ Header → src/components/layout/Header.tsx
🆕 PasswordToggle → 신규 필요
```

### 사용 예시 - PC (2단계)

```
사용자: /ui-spec reference/figma/01.위험성평가목록.png --platform pc

Claude:
📄 PC 기획 문서 생성 완료

[1단계: 기획 문서]
파일: docs/ui-specs/pc/plans/2026-01-16-위험성평가목록-기획.md

## 요약
- 화면 목적: 위험성평가 목록 조회 및 관리
- 주요 기능: 검색, 필터링, 정렬, CRUD
- 사용자 시나리오: 3개
- API 엔드포인트: GET /risk-assessments, POST, PUT, DELETE

💡 구현 명세서 생성: /ui-spec reference/figma/01.위험성평가목록.png --platform pc --step spec
```

```
사용자: /ui-spec reference/figma/01.위험성평가목록.png --platform pc --step spec

Claude:
📄 PC 구현 명세서 생성 완료

[2단계: 구현 명세서]
파일: docs/ui-specs/pc/specs/2026-01-16-위험성평가목록-구현.md

## 요약
- 기획 문서: docs/ui-specs/pc/plans/2026-01-16-위험성평가목록-기획.md
- 컴포넌트: 8개 (기존 5개, 신규 3개)

## 컴포넌트 매핑
✅ Table → src/components/common/Table.tsx
✅ SearchInput → src/components/common/SearchInput.tsx
✅ Button → src/components/common/Button.tsx
✅ Modal → src/components/common/Modal.tsx
✅ Pagination → src/components/common/Pagination.tsx
🆕 RiskAssessmentRow → 신규 필요
🆕 FilterPanel → 신규 필요
🆕 StatusBadge → 신규 필요
```

---

## 7. 작업 순서

| 순서 | 작업 | 설명 |
|------|------|------|
| 1 | `.claude/commands/` 폴더 생성 | 스킬 폴더 |
| 2 | `ui-spec.md` 스킬 프롬프트 작성 | 메인 스킬 |
| 3 | `docs/ui-specs/pc/plans/` 폴더 생성 | PC 기획 문서 |
| 4 | `docs/ui-specs/pc/specs/` 폴더 생성 | PC 구현 명세서 |
| 5 | `docs/ui-specs/mobile/` 폴더 생성 | Mobile 명세서 |
| 6 | `_template-pc-plan.md` 작성 | PC 기획 문서 템플릿 |
| 7 | `_template-pc-spec.md` 작성 | PC 구현 명세서 템플릿 |
| 8 | `_template-mobile.md` 작성 | Mobile 명세서 템플릿 |
| 9 | 테스트: PC 기획 문서 생성 | `--platform pc` |
| 10 | 테스트: PC 구현 명세서 생성 | `--platform pc --step spec` |
| 11 | 테스트: Mobile 명세서 생성 | `--platform mobile` |

---

## 8. 제약사항 및 고려사항

### 동영상 처리
- Claude는 동영상을 직접 분석할 수 없음
- **대안 1**: 사용자에게 주요 프레임 스크린샷 요청
- **대안 2**: ffmpeg 설치 시 자동 프레임 추출

### 이미지 분석 정확도
- 복잡한 화면은 여러 번 분석 필요할 수 있음
- 모호한 경우 사용자에게 확인 요청

---

## 9. 완료 기준

### 기본 기능
- [ ] `/ui-spec` 명령어 동작
- [ ] 플랫폼 자동 감지 동작 (PC/Mobile)
- [ ] `--platform` 옵션으로 명시적 지정 가능
- [ ] 동영상 흐름 분석 가능 (프레임 기반)

### PC 2단계 프로세스
- [ ] PC 기획 문서 생성 → `docs/ui-specs/pc/plans/`에 저장
- [ ] PC 구현 명세서 생성 → `docs/ui-specs/pc/specs/`에 저장
- [ ] `--step plan` 옵션으로 기획 문서만 생성 가능
- [ ] `--step spec` 옵션으로 구현 명세서만 생성 가능
- [ ] 기획 문서 없이 구현 명세서 생성 시 경고

### Mobile 1단계 프로세스
- [ ] Mobile 이미지 분석 → `docs/ui-specs/mobile/`에 명세서 저장

### 컴포넌트 매핑
- [ ] PC 컴포넌트 매핑 (`apps/admin-web/src/components/`)
- [ ] Mobile 컴포넌트 매핑 (`apps/worker-mobile/src/components/`)
- [ ] 기존 컴포넌트 → 경로 표시
- [ ] 신규 필요 → "🆕" 표시
- [ ] 수정 필요 → "⚠️" 표시

### 템플릿
- [ ] `_template-pc-plan.md` 작성 완료
- [ ] `_template-pc-spec.md` 작성 완료
- [ ] `_template-mobile.md` 작성 완료
