# 최초/정기 위험성평가 만들기 (PC) - 화면 스펙

## 1. 개요
- 목적: 최초/정기 위험성평가 문서를 생성한다.
- 진입: 위험성평가 목록 → 유형 선택(최초/정기)

## 2. 화면 구성
- 헤더: 뒤로가기, 화면 제목
- 기본 정보 카드
  - 현장명, 소속 회사
  - 결재라인 요약 + 변경 버튼
  - 결재자 미리보기 테이블
  - 작업기간 (시작/종료)
  - 위험성 수준 안내 문구
- 작업 공종 영역
  - 대분류 리스트 (카드 반복)
  - 대분류 추가 버튼
- 하단 액션
  - 취소, 만들기

## 3. 주요 동작
- 결재라인 변경
  - 공용/위험성평가 태그 필터 적용
  - 선택 시 기본 정보 카드에 반영
- 작업 공종
  - 대분류 선택 → 소분류 선택
  - 소분류 직접 추가(사용자 입력)
  - 위험요인 검색/직접 입력 모달
- 제출 검증
  - 최소 1개 대분류
  - 각 대분류에 소분류 1개 이상
  - 각 소분류에 위험요인 1개 이상
  - 위험요인: 수준/개선대책 필수

## 4. 데이터 저장 (임시)
- 생성 시 localStorage에 저장
  - key: `risk-assessment:draft:{id}`
- 저장 후 상세 화면으로 이동

## 5. 경로
- 최초: `/safety/risk/create/initial`
- 정기: `/safety/risk/create/regular`

## 6. 구현 참고
- `apps/admin-web/src/components/risk-assessment/forms/InitialAssessmentForm.tsx`
- `apps/admin-web/src/pages/risk-assessment/CreateAssessmentPage.tsx`
