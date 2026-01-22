# Signin vs Figma Alignment Checklist

This checklist compares signin PRD vs Figma screen specs for the worker app.

## Reference Docs
- PRD: `docs/signin/통패스_근로자앱_가입_PRD.md`
- Figma structure: `docs/figma/screen-structure.md`
- Figma specs: `docs/figma/screen-specs/*`

## Screen Mapping (Results)

| Figma ID | Screen | PRD Section | Status | Notes |
|----------|--------|-------------|--------|-------|
| A00 | Auth Entry | 5. 사용자 플로우 / 6.0 추가 화면 | PARTIAL | 로그인 섹션 포함, 상세 UI는 PRD에 없음. |
| L02 | Password Reset | 6.0 추가 화면 | PARTIAL | 플로우만 있음, 상세 정책/문구는 PRD에 없음. |
| A01 | Company Code | 6.1 회사코드 입력 | PARTIAL | PRD는 형식 체크만 언급, Figma는 6자리 고정(min/max). |
| A02 | Site Select | 6.1 회사코드 입력 (현장 선택 분기) | OK | 1개 자동 선택, 2개 이상 선택 화면 일치. |
| A03 | Phone Input | 6.2 전화번호 입력 & 인증 | PARTIAL | "전화번호=ID" 정책은 PRD에만 명시. 번호 변경 불가 안내는 Figma에 없음. |
| A04 | Verify Code | 6.2 전화번호 입력 & 인증 | PARTIAL | 6자리/3분 타이머 일치. Figma 재전송 60초 쿨다운은 PRD에 없음. |
| A09 | Password Setup | 4. 입력 항목 비교표 / 6.0 추가 화면 | OK | 비밀번호 단계 추가 일치. |
| A05 | Info Input | 6.3 근로자 정보 입력 | OK | 필드/선등록 배너 구성 일치. |
| A06 | Terms Agreement | 6.4 약관 동의 | OK | 4개 필수 약관 구성 동일. |
| A07 | Signature | 6.5 전자서명 | PARTIAL | 서명 필수는 일치. Base64 저장 포맷은 Figma에 없음. |
| A08 | Waiting Approval | 6.6 승인 대기 | PARTIAL | status==REQUESTED 일치. 뒤로가기 차단/Blocking은 Figma에 없음. |
| P04 | Company List | 6.0 추가 화면 | PARTIAL | 목록/추가 흐름은 정의, 상세 문구는 PRD에 없음. |
| P05 | Personal QR | 6.0 추가 화면 | PARTIAL | 개인 QR 발급 정의는 있음, 상세 정책은 PRD에 없음. |

## Field Alignment Checklist (Results)

### Core Rules
- [OK] 회사코드 없으면 가입 불가 (회사코드 입력 A01 존재)
- [OK] 휴대폰 번호가 로그인 ID로 사용됨 (PRD 명시)
- [OK] 로그인/가입 분리 (A00)
- [OK] 비밀번호 설정 단계 존재 (A09)
- [OK] 가입 방식 A/B 분기 흐름 존재 (A04 이후 분기)
- [GAP] 근로자 상태값 라벨 표기 (Figma에 상태 코드/라벨 표기 없음)

### Step A01-A02 (Company/Site)
- [PARTIAL] 회사코드 입력 포맷/검증 규칙 (Figma: 6자리 고정, PRD: 형식 체크만)
- [OK] 현장 선택 리스트 기준(회사 단위)
- [OK] 팀(업체) 선택은 A05에서 수행

### Step A03-A04 (Phone Auth)
- [OK] SMS 인증번호 자리수(6자리)
- [PARTIAL] 인증 타이머/재전송 제한 (3분 타이머 일치, 재전송 쿨다운은 PRD에 없음)
- [GAP] 번호 변경 불가 안내 (PRD 있음, Figma 없음)

### Step A05 (Info Input)
- [OK] 이름 (필수)
- [OK] 휴대폰 (필수, 읽기 전용)
- [OK] 생년월일 (필수, 8자리)
- [OK] 직책/직종 (필수)
- [OK] 소속 팀(업체) (앱에서 선택)
- [OK] 권한 선택 없음 (PRD: 앱 직접가입은 WORKER 고정)
- [OK] 국적/성별 (필수)

### Step A06 (Terms)
- [OK] 전체 동의와 개별 동의 제공
- [OK] 필수 항목 4개 구성

### Step A07 (Signature)
- [GAP] 서명 캡처 저장 포맷 (PRD: Base64, Figma 미기재)
- [OK] 서명 필수 조건/스킵 불가

### Step A08 (Waiting)
- [OK] REQUESTED 상태 진입 조건
- [PARTIAL] 승인 후 ACTIVE 전환 안내 (PRD: 메인 진입, Figma 상세 메시지 없음)

---

## Notes / To Verify
- L02 비밀번호 재설정 정책(문구/버튼) PRD에 상세 추가 필요
- Figma에 "번호 변경 불가" 안내 문구 추가 여부 결정 필요
- 회사코드 길이(6자리 고정) 정책을 PRD에 명시할지 결정 필요
- 서명 저장 포맷(Base64) UI 스펙에 명시 여부 결정 필요
