# 위험성평가 PC 관리자 MVP (업그레이드 문서)

## 1. 범위
- 대상: PC 관리자 위험성평가 (최초/정기)
- 제외: 모바일/근로자 앱, 수시 문서 (후속 확장)

## 2. 사용자 흐름
1) 위험성평가 목록 → 유형 선택
2) 최초/정기 위험성평가 만들기
3) 생성 후 상세보기로 이동
4) 상세보기에서 작업기간 상태별 동작 확인

## 3. MVP 기능 정의
- 만들기
  - 유형: 최초/정기 동일 폼 사용
  - 결재라인 선택 (공용/위험성평가 태그 필터)
  - 작업기간 입력
  - 작업 공종(대분류/소분류) + 위험요인/개선대책 입력
  - 최소 입력 검증 (공종/소분류/위험요인/수준/개선대책)
- 상세보기
  - 작업기간 상태: 작업기간 전/중/종료
  - 전자서명: 결재라인별 개별 서명 적용
  - 결재라인 변경 시 기존 서명 초기화 경고
  - 종료 상태에서 재작성 버튼 노출
- 목록
  - 생성한 문서를 목록에서 확인 (로컬 저장 기반)

## 4. 데이터 보관 (임시)
- 만들기 결과는 `localStorage`에 저장
  - key: `risk-assessment:draft:{id}`
  - 상세보기에서 우선 로드

## 5. 상태별 동작 규칙
- 작업기간 전
  - 작업기간 수정 가능
  - 결재라인 변경 가능
- 작업기간 중
  - 시작일 수정 불가, 종료일만 수정 가능
  - 결재라인 변경 가능
- 작업종료
  - 수정 불가
  - 재작성 버튼 노출

## 6. 구현 참고
- 만들기: `apps/admin-web/src/pages/risk-assessment/CreateAssessmentPage.tsx` (regular 매핑 포함)
- 레거시 기반 폼: `apps/admin-web/src/components/risk-assessment/forms/InitialAssessmentForm.tsx` (type prop)
- 상세보기: `apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx`

## 7. 변경 이력
- 정기 위험성평가 지원 추가 (커밋: 13dbfa8)
  - InitialAssessmentForm에 type prop 추가
  - CreateAssessmentPage에 regular 매핑 추가
  - 최초/정기 공통 폼 유지
