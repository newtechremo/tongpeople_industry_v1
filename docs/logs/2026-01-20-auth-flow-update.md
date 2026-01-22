# 인증/로그인 플로우 변경 정리 (2026-01-20)

## 목적
- 로그인/가입 분리, 비밀번호 도입, 개인 계정(INDIVIDUAL) 흐름 정의
- 화면 스펙 파일명 체계 정리(A/L/M/Q/P)
- 한글 인코딩 깨짐 복구

## 핵심 변경
- A00 로그인/가입 선택 화면에 로그인 섹션 통합
- 로그인 섹션: 전화번호+비밀번호 + 관리자 로그인 체크
- L02 비밀번호 재설정 플로우 추가
- A09 비밀번호 설정 단계 추가 (A04 이후)
- 개인 계정 흐름: P04 참여 회사 목록, P05 개인 QR
- 로그인은 회사코드 없이 가능, 가입은 회사코드 필수

## 문서 변경
- PRD: `docs/signin/통패스_근로자앱_가입_PRD.md`
  - 비밀번호 단계 추가
  - 로그인/가입 분리 및 개인 계정 흐름 반영
  - 사용자 플로우 업데이트
- 로그인 정책: `docs/signin/LOGIN-RRD.md`
- 화면 구조: `docs/figma/screen-structure.md`
- 화면 스펙 신규:
  - `docs/figma/screen-specs/A00-auth-entry.md` (로그인 섹션 포함)
  - `docs/figma/screen-specs/L02-password-reset.md`
  - `docs/figma/screen-specs/A09-password-setup.md`
  - `docs/figma/screen-specs/P04-company-list.md`
  - `docs/figma/screen-specs/P05-personal-qr.md`
- 기존 스펙 흐름 수정:
  - `docs/figma/screen-specs/A01-company-code.md` (접근 조건)
  - `docs/figma/screen-specs/A04-verify-code.md` (다음 화면 A09)
  - `docs/figma/screen-specs/A05-info-input.md` (이전 화면 A09)

## 파일명 체계
- 기존 `00/01/...` 숫자 파일명을 `A/L/M/Q/P` 접두어 기반으로 통일
- 예: `01-company-code.md` -> `A01-company-code.md`

## 영향 범위
- 모바일 인증/로그인 플로우 구현
- 테스트/QA 시나리오 업데이트 필요

## 남은 결정 사항
- L02 비밀번호 재설정 상세 정책(PRD 보강 여부)
- 관리자 로그인 체크 실패 메시지/UX 결정
