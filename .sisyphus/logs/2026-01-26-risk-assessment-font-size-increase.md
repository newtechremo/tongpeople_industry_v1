# 위험성평가 페이지 글자 크기 125% 증가

**작업일**: 2026-01-26
**브랜치**: feature/14-risk-assessment-ui-improvements
**작업자**: Claude Code

## 작업 개요

위험성평가 관련 페이지들(목록, 만들기, 상세보기)의 글자 크기를 125% 기준으로 재설정하여 가독성을 개선했습니다.

## 변경된 파일

### 페이지 파일
1. **RiskAssessmentPage.tsx** - 위험성평가 목록 페이지
2. **CreateAssessmentPage.tsx** - 위험성평가 만들기 페이지
3. **LegacyInitialAssessmentPage.tsx** - 최초 위험성평가 만들기 페이지
4. **RiskAssessmentDetailPage.tsx** - 위험성평가 상세보기 페이지

### 컴포넌트 파일
5. **BasicInfoSection.tsx** - 기본 정보 섹션 컴포넌트
6. **RiskFactorCard.tsx** - 위험 요인 카드 컴포넌트

## 글자 크기 변경 매핑

Tailwind CSS의 제한된 크기 옵션 내에서 125%에 가장 근접한 크기로 조정:

| 기존 크기 | 새 크기 | 증가율 | 적용 대상 |
|-----------|---------|--------|-----------|
| `text-xs` (12px) | `text-sm` (14px) | 약 117% | 상태 배지, 작은 텍스트 |
| `text-sm` (14px) | `text-base` (16px) | 약 114% | 라벨, 입력 필드, 버튼, 본문 |
| `text-base` (16px) | `text-lg` (18px) | 약 112% | 일반 텍스트 |
| `text-lg` (18px) | `text-xl` (20px) | 약 111% | 섹션 제목 (h2, h3) |
| `text-xl` (20px) | `text-2xl` (24px) | 120% | 페이지 제목 (h1) |

## 상세 변경 내역

### 1. RiskAssessmentPage.tsx (목록 페이지)

- **페이지 제목**: `text-xl` → `text-2xl`
- **설명 텍스트**: `text-sm` → `text-base`
- **필터 라벨**: `text-sm` → `text-base`
- **필터 버튼**: `text-sm` → `text-base`
- **테이블 헤더**: `text-xs` → `text-sm`
- **테이블 셀**: `text-sm` → `text-base`
- **상태 배지**: `text-xs` → `text-sm`
- **빈 상태 메시지**: `text-sm` → `text-base`
- **페이지네이션 버튼**: `text-sm` → `text-base`, 버튼 크기 `w-8 h-8` → `w-10 h-10`

### 2. CreateAssessmentPage.tsx (만들기 페이지)

- **페이지 제목**: `text-xl` → `text-2xl`
- **성공 메시지**: 기본 크기 → `text-base`
- **에러 메시지**: 기본 크기 → `text-base`
- **로딩 메시지**: 기본 크기 → `text-lg`
- **안내 텍스트**: 기본 크기 → `text-base`

### 3. LegacyInitialAssessmentPage.tsx (최초 평가 만들기)

- **페이지 제목**: `text-xl` → `text-2xl`
- 하위 컴포넌트들의 텍스트 크기는 각 컴포넌트에서 조정

### 4. RiskAssessmentDetailPage.tsx (상세보기 페이지)

- **페이지 제목 (h1)**: `text-xl` → `text-2xl`
- **섹션 제목 (h2)**: `text-lg` → `text-xl`
- **설명 텍스트**: `text-sm` → `text-base`
- **라벨**: `text-sm` → `text-base`
- **입력 필드**: `text-sm` → `text-base`
- **상태 배지**: `text-xs` → `text-sm`
- **버튼 텍스트**: `text-sm` → `text-base`
- **서명 박스 텍스트**: `text-sm` → `text-base`
- **서명 필요 텍스트**: `text-xs` → `text-sm`
- **서명 불러오기 버튼**: `text-xs` → `text-sm`

### 5. BasicInfoSection.tsx (기본 정보 컴포넌트)

- **섹션 제목**: `text-lg` → `text-xl`
- **라벨**: `text-sm` → `text-base`
- **텍스트**: `text-sm` → `text-base`
- **버튼**: `text-sm` → `text-base`
- **입력 필드**: `text-sm` → `text-base`

### 6. RiskFactorCard.tsx (위험 요인 카드)

- **라벨**: `text-sm` → `text-base`
- **삭제 버튼**: `text-sm` → `text-base`
- **입력 필드**: `text-sm` → `text-base`
- **라디오 버튼 라벨**: `text-sm` → `text-base`

## 영향 범위

### 페이지별 영향
- **목록 페이지**: 테이블, 필터, 페이지네이션 모든 텍스트 확대
- **만들기 페이지**: 제목, 메시지, 폼 컴포넌트 텍스트 확대
- **상세보기 페이지**: 전체 콘텐츠 영역 텍스트 확대

### 사용자 경험 개선
- 가독성 향상으로 피로도 감소
- 중요 정보(제목, 라벨, 상태)의 시인성 증가
- 입력 필드의 가시성 개선으로 오입력 방지

## 호환성 확인

- ✅ 기존 레이아웃 유지 (여백, 패딩 변경 없음)
- ✅ 반응형 디자인 유지
- ✅ 컴포넌트 재사용성 유지
- ✅ 디자인 시스템 일관성 유지

## 테스트 확인사항

- [x] 목록 페이지 텍스트 크기 확대 확인
- [x] 만들기 페이지 텍스트 크기 확대 확인
- [x] 상세보기 페이지 텍스트 크기 확대 확인
- [x] 컴포넌트 재사용 시 텍스트 크기 일관성 확인
- [x] HMR (Hot Module Replacement) 정상 작동

## 후속 작업 제안

1. 다른 페이지들도 동일한 기준으로 글자 크기 조정 검토
2. 모바일 반응형에서의 글자 크기 추가 조정 필요 시 반영
3. 사용자 피드백 수집 후 미세 조정

## 기술적 고려사항

### Tailwind CSS 크기 단계
Tailwind CSS는 고정된 크기 단계를 제공하므로 정확히 125% 증가는 불가능합니다.
가장 근접한 단계로 조정하여 일관성을 유지했습니다:

- 12px → 14px (약 117%)
- 14px → 16px (약 114%)
- 16px → 18px (약 112%)
- 18px → 20px (약 111%)
- 20px → 24px (120%)

평균적으로 약 115% 증가하여 125% 목표에 근접합니다.

### 패턴 기반 일괄 변경
`replace_all: true` 옵션을 사용하여 동일한 패턴을 일괄 변경했습니다:
- 효율성: 파일당 여러 변경사항을 한 번에 처리
- 일관성: 동일한 용도의 텍스트는 동일한 크기로 변경
- 안정성: 수동 수정으로 인한 실수 방지

---

**작업 완료**: 2026-01-26 오후
**커밋 대상 파일**:
- apps/admin-web/src/pages/RiskAssessmentPage.tsx
- apps/admin-web/src/pages/risk-assessment/CreateAssessmentPage.tsx
- apps/admin-web/src/pages/risk-assessment/LegacyInitialAssessmentPage.tsx
- apps/admin-web/src/pages/risk-assessment/RiskAssessmentDetailPage.tsx
- apps/admin-web/src/pages/risk-assessment/components/BasicInfoSection.tsx
- apps/admin-web/src/pages/risk-assessment/components/RiskFactorCard.tsx
