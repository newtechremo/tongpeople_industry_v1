# Claude Code 스킬 가이드

이 문서는 프로젝트에서 사용 가능한 Claude Code 스킬의 사용법을 설명합니다.

---

## 스킬 목록

| 스킬 | 설명 | 경로 |
|------|------|------|
| `/ui-spec` | 레퍼런스 이미지/동영상을 분석하여 UI 명세서 생성 | `.claude/commands/ui-spec.md` |

---

## /ui-spec

Figma 스크린샷이나 동영상을 분석하여 UI 명세서를 자동 생성합니다.

### 기본 사용법

```bash
/ui-spec <파일경로>
```

### 인자 (Arguments)

| 인자 | 필수 | 설명 | 예시 |
|------|:----:|------|------|
| `file_path` | ✅ | 분석할 이미지 또는 동영상 파일 경로 | `C:/reference/화면.png` |
| `platform` | ❌ | 플랫폼 지정 (`pc` 또는 `mobile`). 미지정시 자동 감지 | `--platform pc` |
| `step` | ❌ | PC 전용 - 단계 지정 (`plan` 또는 `spec`). 미지정시 plan부터 | `--step spec` |

### 지원 파일 형식

- **이미지**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
- **동영상**: `.mp4`, `.mov`, `.avi`, `.webm`

---

### 플랫폼별 프로세스

| 플랫폼 | 프로세스 | 출력 파일 수 |
|--------|----------|:------------:|
| **PC** | 기획 문서 → 구현 명세서 (2단계) | 2개 |
| **Mobile** | UI 명세서 (1단계) | 1개 |

---

### 사용 예시

#### 예시 1: PC 화면 이미지 분석 (기획 문서 생성)

```bash
/ui-spec C:/hongtong/reference/figma/위험성평가목록.png
```

**출력:**
```
docs/ui-specs/pc/plans/2026-01-16-위험성평가목록-기획.md
```

#### 예시 2: PC 구현 명세서 생성 (2단계)

```bash
/ui-spec C:/hongtong/reference/figma/위험성평가목록.png --platform pc --step spec
```

**출력:**
```
docs/ui-specs/pc/specs/2026-01-16-위험성평가목록-구현.md
```

#### 예시 3: 모바일 화면 분석

```bash
/ui-spec C:/hongtong/reference/figma/로그인화면.png --platform mobile
```

**출력:**
```
docs/ui-specs/mobile/2026-01-16-로그인화면.md
```

#### 예시 4: 동영상 분석 (여러 화면 포함)

```bash
/ui-spec C:/hongtong/reference/figma/위험성평가-상세보기.mp4
```

동영상의 경우 Python OpenCV로 프레임을 추출한 후 분석합니다.
여러 화면이 포함된 경우 구간별로 문서를 분리할 수 있습니다.

---

### 출력 파일 위치

| 플랫폼 | 문서 유형 | 경로 |
|--------|----------|------|
| PC | 기획 문서 | `docs/ui-specs/pc/plans/{날짜}-{화면명}-기획.md` |
| PC | 구현 명세서 | `docs/ui-specs/pc/specs/{날짜}-{화면명}-구현.md` |
| Mobile | UI 명세서 | `docs/ui-specs/mobile/{날짜}-{화면명}.md` |

### 템플릿 파일

| 플랫폼 | 템플릿 경로 |
|--------|------------|
| PC 기획 | `docs/ui-specs/_template-pc-plan.md` |
| PC 구현 | `docs/ui-specs/_template-pc-spec.md` |
| Mobile | `docs/ui-specs/_template-mobile.md` |

---

### 컴포넌트 매핑 표기

생성된 문서에서 컴포넌트 상태는 다음과 같이 표시됩니다:

| 표시 | 의미 | 설명 |
|:----:|------|------|
| ✅ | 기존 사용 가능 | 경로와 함께 표시 |
| 🆕 | 신규 필요 | 새로 만들어야 함 |
| ⚠️ | 수정 필요 | 기존 컴포넌트 수정 필요 |

---

### 주의사항

1. **동영상 분석 시**: 한글 경로에서 문제가 발생할 수 있으므로 영문 temp 폴더 사용
2. **PC 2단계**: 구현 명세서 생성 전 기획 문서가 먼저 존재해야 함
3. **API 스키마**: 구현 명세서에는 Request/Response 스키마 필수 포함
4. **기존 코드 확인**: 새 컴포넌트 생성 전 기존 컴포넌트 재사용 가능 여부 확인

---

## 스킬 추가 방법

새로운 스킬을 추가하려면:

1. `.claude/commands/` 폴더에 `{스킬명}.md` 파일 생성
2. YAML 프론트매터로 메타데이터 정의:
   ```yaml
   ---
   name: 스킬명
   description: 스킬 설명
   arguments:
     - name: arg1
       description: 인자 설명
       required: true
   ---
   ```
3. 마크다운으로 스킬 동작 정의
4. 이 문서(`docs/SKILLS.md`)에 스킬 정보 추가

---

## 참고 링크

- [Claude Code 공식 문서](https://docs.anthropic.com/claude-code)
- 프로젝트 설정: `CLAUDE.md`
