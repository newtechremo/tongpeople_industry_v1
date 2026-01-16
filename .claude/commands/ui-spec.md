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

레퍼런스 이미지/동영상을 분석하여 UI 문서를 생성합니다.

## 플랫폼별 프로세스

| 플랫폼 | 프로세스 | 출력 파일 |
|--------|----------|-----------|
| **Mobile** | 레퍼런스 → UI 명세서 | 1개 |
| **PC** | 레퍼런스 → 기획 문서 → 구현 명세서 | 2개 |

---

## 수행 작업

### 1. 입력 파일 확인
- 파일 경로: `$ARGUMENTS.file_path`
- Read 도구로 파일 읽기
- 이미지 확장자: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
- 동영상 확장자: `.mp4`, `.mov`, `.avi`, `.webm`

### 2. 플랫폼 판별
**`$ARGUMENTS.platform` 지정 시 해당 플랫폼 사용**

**미지정 시 자동 감지:**
- 이미지 비율: 세로 > 가로 → Mobile, 가로 > 세로 → PC
- 화면 요소: Sidebar 있음 → PC, TabBar 있음 → Mobile
- 파일명 힌트: "앱", "mobile", "모바일" → Mobile / "관리자", "admin", "PC" → PC

### 3. 화면 분석
이미지/동영상을 분석하여 다음을 식별:

**공통:**
- 레이아웃 구조
- UI 컴포넌트 (버튼, 입력, 테이블/리스트 등)
- 색상 및 스타일링

**PC:**
- Sidebar + Header + Content 구조
- 인터랙션: 클릭, 호버, 드래그

**Mobile:**
- Header + Content + TabBar 구조
- 인터랙션: 탭, 스와이프, 길게 누르기

### 4. 동영상 분석 (해당 시)

**프레임 추출 방법 (Python OpenCV):**
```python
import cv2
import os

video_path = "원본경로"
output_dir = "C:/hongtong/reference/figma/frames_temp/"  # 영문 경로 사용
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# 2초 간격으로 프레임 추출
interval = int(fps * 2)
frame_count = 0
saved_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    if frame_count % interval == 0:
        # 한글 경로 문제 해결: imencode 사용
        output_path = f"{output_dir}frame_{saved_count:03d}.jpg"
        _, encoded = cv2.imencode('.jpg', frame)
        with open(output_path, 'wb') as f:
            f.write(encoded.tobytes())
        saved_count += 1
    frame_count += 1

cap.release()
print(f"추출 완료: {saved_count}개 프레임")
```

**분석 프로세스:**
1. 프레임 추출 후 Read 도구로 이미지 분석
2. 화면 전환 흐름 파악 (구간별 그룹핑)
3. 상태 변화 식별 (로딩, 성공, 에러, 모달 등)
4. 구간별 문서 분리 여부 결정
5. 상태 전이 다이어그램 작성

---

## PC 프로세스 (2단계)

### 단계 1: 기획 문서 생성

**조건**: `$ARGUMENTS.step`이 미지정 또는 `plan`인 경우

**템플릿**: `docs/ui-specs/_template-pc-plan.md`

**포함 내용:**
1. 화면 목적 및 사용자 시나리오
2. 주요 기능 목록
3. 데이터 흐름 (API 엔드포인트, 상태 관리)
4. 사용자 인터랙션 시나리오
5. 비즈니스 로직
6. 예외 처리 (에러 상태)

**저장 위치:**
```
docs/ui-specs/pc/plans/{YYYY-MM-DD}-{화면명}-기획.md
```

**출력 예시:**
```
📄 PC 기획 문서 생성 완료

[1단계: 기획 문서]
파일: docs/ui-specs/pc/plans/2026-01-16-위험성평가목록-기획.md

## 요약
- 화면 목적: 위험성평가 목록 조회 및 관리
- 주요 기능: 검색, 필터링, 정렬, CRUD
- API 엔드포인트: 4개

💡 구현 명세서 생성: /ui-spec {파일경로} --platform pc --step spec
```

---

### 단계 2: 구현 명세서 생성

**조건**: `$ARGUMENTS.step`이 `spec`인 경우

**전제조건**: 해당 화면의 기획 문서가 존재해야 함
- 기획 문서 없으면 경고 후 기획 문서 먼저 생성 권장

**참조 리소스:**
- 컴포넌트: `apps/admin-web/src/components/`
- 디자인 시스템: `docs/design_guideline_251221.md`
- 기존 페이지: `apps/admin-web/src/pages/`

**템플릿**: `docs/ui-specs/_template-pc-spec.md`

**포함 내용:**
1. 연결된 기획 문서
2. 컴포넌트 구조 (트리)
3. 기존 컴포넌트 매핑 (✅ 표시)
4. 신규 필요 컴포넌트 (🆕 표시)
5. 수정 필요 컴포넌트 (⚠️ 표시)
6. Props 인터페이스
7. 스타일링 가이드 (Tailwind 클래스)
8. 상태 관리 방식

**저장 위치:**
```
docs/ui-specs/pc/specs/{YYYY-MM-DD}-{화면명}-구현.md
```

**출력 예시:**
```
📄 PC 구현 명세서 생성 완료

[2단계: 구현 명세서]
파일: docs/ui-specs/pc/specs/2026-01-16-위험성평가목록-구현.md

## 요약
- 기획 문서: docs/ui-specs/pc/plans/2026-01-16-위험성평가목록-기획.md
- 컴포넌트: 8개 (기존 5개, 신규 3개)

## 컴포넌트 매핑
✅ Table → src/components/common/Table.tsx
✅ Button → src/components/common/Button.tsx
🆕 RiskAssessmentRow → 신규 필요
🆕 FilterPanel → 신규 필요
```

---

## Mobile 프로세스 (1단계)

**참조 리소스:**
- 컴포넌트: `apps/worker-mobile/src/components/`
- 디자인 시스템: `docs/figma/design-system-mobile.md`
- 테마: `apps/worker-mobile/src/theme/`

**템플릿**: `docs/ui-specs/_template-mobile.md`

**포함 내용:**
1. 화면 목적
2. 레이아웃 구조 (ASCII 다이어그램)
3. 컴포넌트 매핑 (기존/신규)
4. 인터랙션 패턴
5. 상태 전이 (동영상인 경우)
6. 디자인 시스템 참조

**저장 위치:**
```
docs/ui-specs/mobile/{YYYY-MM-DD}-{화면명}.md
```

**출력 예시:**
```
📄 Mobile UI 명세서 생성 완료

파일: docs/ui-specs/mobile/2026-01-16-로그인.md

## 요약
- 화면: 로그인
- 컴포넌트: 4개 (기존 3개, 신규 1개)

## 컴포넌트 매핑
✅ Input → src/components/ui/Input.tsx
✅ Button → src/components/ui/Button.tsx
✅ Header → src/components/layout/Header.tsx
🆕 PasswordToggle → 신규 필요
```

---

## 컴포넌트 매핑 규칙

| 상태 | 표시 | 설명 |
|------|------|------|
| 기존 사용 가능 | ✅ | 경로 표시 |
| 신규 필요 | 🆕 | "신규 필요" 표시 |
| 수정 필요 | ⚠️ | 수정 내용 명시 |

---

## 파일명 규칙

- 날짜: `YYYY-MM-DD` (오늘 날짜)
- 화면명: 원본 파일명에서 확장자 제외, 공백은 유지
- PC 기획: `{날짜}-{화면명}-기획.md`
- PC 구현: `{날짜}-{화면명}-구현.md`
- Mobile: `{날짜}-{화면명}.md`

---

## 주의사항

1. **동영상 분석**: Python OpenCV로 프레임 추출 후 분석 (한글 경로는 영문 temp 폴더 사용)
2. **복잡한 화면**: 여러 상태가 있는 경우 각 상태별로 분석
3. **구간 분리**: 동영상에 여러 화면/시나리오가 있으면 구간별로 문서 분리 고려
4. **기존 코드 참조**: 반드시 기존 컴포넌트를 먼저 확인 후 매핑
5. **PC 2단계**: 구현 명세서 생성 시 기획 문서가 없으면 먼저 기획 문서 생성 권장
6. **API 스키마**: 구현 명세서에는 반드시 Request/Response 스키마 포함
