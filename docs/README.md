# Docs Navigation

이 문서는 `docs/` 내 산개된 문서를 빠르게 찾기 위한 네비게이션입니다.  
최신 결정/정의는 **중앙 문서**에 두고, 상세/원본은 링크로 참조합니다.

## 1. 기준 문서 (핵심)
- `CLAUDE.md` 프로젝트 핵심 개요/역할/조직/권한 기준
- `docs/PROJECT-OVERVIEW.md` 서비스 개요 및 단계(Phase)
- `docs/ARCHITECTURE.md` 기술 아키텍처/구성도
- `docs/DEVELOPMENT.md` 개발 환경/명령어
- `docs/DATABASE.md` DB 구조/마이그레이션
- `docs/CHANGELOG.md` 변경 이력

## 2. 도메인별 문서

### 2.1 인증/가입 (근로자 앱 중심)
- `docs/signin/통패스_근로자앱_가입_PRD.md` 가입 플로우/입력 항목 정의(정의 기준)
- `docs/signin/회사코드_QR_가입_기획서.md` 회사코드/QR 관련 기획
- `docs/signin/LOGIN-RRD.md` 로그인/개인계정/관리자 체크 정책 정의
- `docs/figma/screen-structure.md` 가입/인증 화면 구조(화면 레퍼런스)
- `docs/figma/screen-specs/*` 각 화면 스펙(모바일)
  - `docs/figma/screen-specs/A00-auth-entry.md` A00 로그인/가입 선택
  - `docs/figma/screen-specs/L02-password-reset.md` L02 비밀번호 재설정
  - `docs/figma/screen-specs/A09-password-setup.md` A09 비밀번호 설정
  - `docs/figma/screen-specs/P04-company-list.md` P04 참여 회사 목록
  - `docs/figma/screen-specs/P05-personal-qr.md` P05 개인 QR 발급

정합성 규칙(권장):
- **정의는 PRD**, **화면 흐름은 Figma 문서**를 기준으로 본다.

### 2.2 근로자 관리 (관리자 웹)
- `docs/features/worker-management.md` 근로자 관리 UI/동작 명세

### 2.3 위험성평가 / 결재라인 (관리자 웹)
- `docs/risk-assessment/위험성평가_기획서.md`
- `docs/risk-assessment/위험성평가_개발명세서.md`
- `docs/risk-assessment/결재시스템_명세서.md`
- `docs/risk-assessment/수시위험성평가_만들기폼_UI설계.md`
- `docs/ui-specs/pc/plans/*` 화면 기획서
- `docs/ui-specs/pc/specs/*` 구현 명세서
- `docs/logs/2026-01-16-risk-assessment-*.md` 작성/진행 로그

권장 분리:
- `docs/ui-specs/`는 **소스 추출/작성용**으로 보고,
- 실제 기능 단위 문서는 `docs/risk-assessment/`에 모은다.

## 3. 디자인/가이드
- `docs/design_guideline_251221.md` 디자인 시스템(오렌지 테마)
- `docs/figma/design-system-mobile.md` 모바일 디자인 시스템

## 4. QA/테스트
- `docs/QA-AUTH-MANUAL-GUIDE.md` 인증 시스템 수동 테스트
- `docs/QA-AUTH-CHECKLIST.md` 인증 QA 체크리스트

## 5. 로그/작업기록
- `docs/logs/*` 기능/문서 작성 로그
- `docs/work-logs/*` 작업 로그
- `docs/작업로그_20260113_근로자가입.md` 가입 작업 로그

## 6. 참고/기타
- `docs/hyunjangtong-industry-tongpass_PRD.txt` PRD 원문(요약 포함)
- `docs/PROJECT-OVERVIEW.md.bak` 백업 파일
- `docs/SKILLS.md` 내부 스킬 안내
- `docs/prompts/*` 프롬프트 초안(사용 우선순위 낮음)

---

## 다음 정리 후보
- 로그인/가입 PRD에 신규 플로우 반영 여부 확인
