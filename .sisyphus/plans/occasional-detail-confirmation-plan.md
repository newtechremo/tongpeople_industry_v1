# 수시 상세페이지 확인자 리스트 계획

> 작성일: 2026-02-19
> 대상: 수시 위험성평가(`OCCASIONAL`) 상세페이지
> 상태: **미착수** — 수시 위험성평가 기본 구현 완료 후 다음 스프린트에서 진행 예정

---

## 1. 핵심 목표

- 수시 상세에서 문서 `확인자 리스트`를 관리한다.
- 확인 이력은 `일자별`로 저장하고 조회한다.
- `일자별 확인자 리스트`를 출력할 수 있어야 한다.
- 작업기간 내 확인자를 모은 `최종 리스트`를 만들고 출력할 수 있어야 한다.

참고:
- 최초/정기에는 이 기능을 넣지 않는다.
- 이유: 최초/정기는 문서 규모가 커 전원 확인 모델이 현실적으로 맞지 않다.

---

## 2. 기능 정의

## 2.1 확인 등록

- 확인의 조건: `PC/모바일에서 해당 수시 문서 상세를 열람하면 확인으로 간주`한다.
- 확인 등록은 수동 버튼이 아니라 `열람 이벤트 기반 자동 등록`으로 처리한다.
- 같은 사용자/같은 날짜 중복 확인은 1건으로 처리한다.

## 2.2 일자별 리스트

- 기준일(`YYYY-MM-DD`)을 선택해 그날 확인한 사람 목록을 본다.
- 목록 출력(인쇄/PDF)을 지원한다.

## 2.3 작업기간 최종 리스트

- 작업기간(`workPeriodStart ~ workPeriodEnd`) 동안 1회 이상 확인한 사람을 고유 목록으로 집계한다.
- 출력(인쇄/PDF)을 지원한다.

---

## 3. 데이터 모델(초안)

## 3.1 확인 이벤트

```ts
interface AssessmentConfirmationEvent {
  id: string;
  assessmentId: string;
  assessmentType: 'OCCASIONAL';
  confirmedByUserId: string;
  confirmedByUserName: string;
  confirmedByDepartment?: string | null;
  confirmedAt: string;   // ISO datetime
  confirmedDate: string; // YYYY-MM-DD (현장 기준)
  source: 'PC' | 'MOBILE';
}
```

제약:
- unique `(assessmentId, confirmedByUserId, confirmedDate)`

## 3.2 집계 결과

```ts
interface FinalConfirmer {
  userId: string;
  name: string;
  department?: string | null;
  firstConfirmedDate: string;
  lastConfirmedDate: string;
  confirmedCount: number;
}
```

---

## 4. 상세페이지 UI 계획

- 섹션명: `문서 확인자`
- 탭 1: `일자별 확인자`
  - 날짜 선택
  - 리스트 테이블
  - `일자별 출력` 버튼
- 탭 2: `작업기간 최종 확인자`
  - 기간 기준 요약 리스트
  - `최종 리스트 출력` 버튼
- 확인 등록 UI는 별도 버튼 없이 자동 처리(열람 시)

---

## 5. 출력 계획

## 5.1 일자별 출력

- 제목: 수시 위험성평가 확인자(일자별)
- 포함 정보:
  - 문서명/현장명/조회일자
  - 일자별 확인자 목록
  - 출력시각/출력자

## 5.2 최종 리스트 출력

- 제목: 수시 위험성평가 확인자(작업기간 최종)
- 포함 정보:
  - 문서명/현장명/작업기간
  - 최종 확인자 목록(고유)
  - 최초/최종 확인일, 확인횟수
  - 출력시각/출력자

---

## 6. 구현 순서

1. 상세페이지 열람 이벤트(PC/모바일)로 확인 자동 등록 로직 추가
2. 상세페이지에 확인자 섹션 UI 추가
3. 일자별 리스트 조회/출력 연결
4. 작업기간 최종 리스트 집계/출력 연결
5. 수시 타입 한정 처리 및 회귀 점검

---

## 7. 완료 기준

- 수시 상세에서 확인 등록 가능
- PC/모바일 열람만으로 확인 등록이 자동 반영됨
- 일자별 조회/출력 가능
- 작업기간 최종 리스트 조회/출력 가능
- 동일 사용자/동일 일자 중복 방지 동작
- 최초/정기 화면에는 기능이 노출되지 않음
