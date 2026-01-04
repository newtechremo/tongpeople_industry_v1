/**
 * 통패스 인증 관련 타입 정의
 */

// ============================================
// SMS 인증
// ============================================

/** SMS 인증 목적 */
export type SmsVerificationPurpose = 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET';

/** SMS 인증 요청 */
export interface SmsVerificationRequest {
  phone: string;  // 010-1234-5678 형식
  purpose: SmsVerificationPurpose;
}

/** SMS 인증 응답 */
export interface SmsVerificationResponse {
  success: boolean;
  message: string;
  expiresAt?: string;  // ISO 8601
}

/** SMS 인증 확인 요청 */
export interface SmsVerifyRequest {
  phone: string;
  code: string;  // 6자리
  purpose: SmsVerificationPurpose;
}

/** SMS 인증 확인 응답 */
export interface SmsVerifyResponse {
  success: boolean;
  message: string;
  token?: string;  // 인증 성공 시 발급되는 임시 토큰
}

// ============================================
// 온보딩 (최초 관리자 가입)
// ============================================

/** 온보딩 Step 1: 개인정보 */
export interface OnboardingStep1 {
  name: string;
  phone: string;
  phoneVerified: boolean;
  verificationToken?: string;  // SMS 인증 성공 시 받은 토큰
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
}

/** 온보딩 Step 2: 회사정보 */
export interface OnboardingStep2 {
  companyName: string;
  ceoName: string;
  address: string;
  addressDetail?: string;
  businessNumber: string;  // 사업자등록번호 (000-00-00000)
  industryCode?: string;   // 업종코드 (선택)
  employeeCountRange?: EmployeeCountRange;  // 직원 수 (선택)
  signupSource?: string;   // 가입 경로 (선택)
}

/** 온보딩 Step 3: 첫 번째 현장 */
export interface OnboardingStep3 {
  siteName: string;
  siteAddress: string;
  checkoutPolicy: 'AUTO_8H' | 'MANUAL';
  autoHours?: number;  // AUTO_8H일 때 기본 8
}

/** 온보딩 Step 4: 비밀번호 설정 */
export interface OnboardingStep4 {
  password: string;
  passwordConfirm: string;
  email?: string;  // 알림용 (선택)
}

/** 전체 온보딩 데이터 */
export interface OnboardingData {
  step1: OnboardingStep1 | null;
  step2: OnboardingStep2 | null;
  step3: OnboardingStep3 | null;
  step4: OnboardingStep4 | null;
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
}

/** 온보딩 완료 요청 (백엔드 API) */
export interface SignupRequest {
  personal: OnboardingStep1;
  company: OnboardingStep2;
  site: OnboardingStep3;
  auth: {
    password: string;
    email?: string;
  };
}

// ============================================
// 로그인
// ============================================

/** 관리자 로그인 요청 */
export interface AdminLoginRequest {
  phone: string;     // 휴대폰 번호 (로그인 ID)
  password: string;
}

/** 로그인 응답 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    phone: string;
    role: 'SUPER_ADMIN' | 'SITE_ADMIN' | 'TEAM_ADMIN' | 'WORKER';
    companyId: number;
    siteId: number | null;
  };
}

// ============================================
// 비밀번호 재설정
// ============================================

/** 비밀번호 재설정 요청 (Step 1: SMS 인증) */
export interface PasswordResetRequest {
  phone: string;
}

/** 비밀번호 재설정 완료 */
export interface PasswordResetConfirm {
  phone: string;
  code: string;
  newPassword: string;
  newPasswordConfirm: string;
}

// ============================================
// 공통 상수
// ============================================

/** 직원 수 범위 */
export type EmployeeCountRange =
  | '5_UNDER'     // 5인 미만
  | '5_49'        // 5~49인
  | '50_299'      // 50~299인
  | '300_OVER'    // 300인 이상
  | 'OTHER';      // 기타

/** 직원 수 범위 라벨 */
export const EMPLOYEE_COUNT_LABELS: Record<EmployeeCountRange, string> = {
  '5_UNDER': '5인 미만',
  '5_49': '5인 ~ 49인',
  '50_299': '50인 ~ 299인',
  '300_OVER': '300인 이상',
  'OTHER': '기타',
};

/** 업종코드 (10차 대분류) */
export const INDUSTRY_CODES = {
  A: '농업, 임업 및 어업',
  B: '광업',
  C: '제조업',
  D: '전기, 가스, 증기 및 공기 조절 공급업',
  E: '수도, 하수 및 폐기물 처리, 원료 재생업',
  F: '건설업',
  G: '도매 및 소매업',
  H: '운수 및 창고업',
  I: '숙박 및 음식점업',
  J: '정보통신업',
  K: '금융 및 보험업',
  L: '부동산업',
  M: '전문, 과학 및 기술 서비스업',
  N: '사업시설 관리, 사업 지원 및 임대 서비스업',
  O: '공공 행정, 국방 및 사회보장 행정',
  P: '교육 서비스업',
  Q: '보건업 및 사회복지 서비스업',
  R: '예술, 스포츠 및 여가관련 서비스업',
  S: '협회 및 단체, 수리 및 기타 개인 서비스업',
  T: '가구 내 고용활동 및 달리 분류되지 않은 자가 소비 생산활동',
  U: '국제 및 외국기관',
  Z: '기타',
} as const;

export type IndustryCode = keyof typeof INDUSTRY_CODES;

/** 직책/직종 옵션 */
export const POSITION_OPTIONS = [
  '공사기사',
  '전기기사',
  '미장기사',
  '설비기사',
  '안전관리자',
  '일반근로자',
] as const;

/** 국적 옵션 */
export const NATIONALITY_OPTIONS = [
  '대한민국',
  '중국',
  '베트남',
  '네팔',
  '미얀마',
  '캄보디아',
  '태국',
  '인도네시아',
  '우즈베키스탄',
  '기타',
] as const;

// ============================================
// 유틸리티 함수
// ============================================

/** 휴대폰 번호 형식 검증 (010-1234-5678) */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/;
  return phoneRegex.test(phone);
}

/** 휴대폰 번호 정규화 (하이픈 제거) */
export function normalizePhone(phone: string): string {
  return phone.replace(/-/g, '');
}

/** 휴대폰 번호 포맷팅 (하이픈 추가) */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
  }
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  return phone;
}

/** 사업자등록번호 형식 검증 (000-00-00000) */
export function isValidBusinessNumber(bizNum: string): boolean {
  const bizNumRegex = /^\d{3}-?\d{2}-?\d{5}$/;
  return bizNumRegex.test(bizNum);
}

/** 사업자등록번호 포맷팅 */
export function formatBusinessNumber(bizNum: string): string {
  const normalized = bizNum.replace(/-/g, '');
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 5)}-${normalized.slice(5)}`;
  }
  return bizNum;
}

/** 비밀번호 강도 검사 (8자 이상, 영문+숫자) */
export function isValidPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: '8자 이상 입력해주세요.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '영문을 포함해주세요.' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: '숫자를 포함해주세요.' };
  }
  return { valid: true, message: '사용 가능한 비밀번호입니다.' };
}
