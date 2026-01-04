/**
 * 산업현장통 - 공통 타입 정의
 */

// ============================================
// 퇴근 정책
// ============================================
export type CheckoutPolicy = 'AUTO_8H' | 'MANUAL';

// ============================================
// 사용자 역할 (4단계)
// ============================================
// 조직 계층: 회사 > 현장 > 팀(업체) > 근로자
export type UserRole =
  | 'SUPER_ADMIN'   // 최고 관리자 (회사/본사) - 시스템 전체 설정, 결제 관리
  | 'SITE_ADMIN'    // 현장 관리자 (현장 소장) - 특정 현장의 모든 데이터 관리
  | 'TEAM_ADMIN'    // 팀 관리자 (업체장/오반장) - 자기 팀원 QR 스캔
  | 'WORKER';       // 근로자 (팀원) - QR 생성, 본인 출퇴근 인증

// 역할별 한글 라벨
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: '최고 관리자',
  SITE_ADMIN: '현장 관리자',
  TEAM_ADMIN: '팀 관리자',
  WORKER: '근로자',
};

// ============================================
// 현장 (Site)
// ============================================
export interface Site {
  id: number;
  name: string;                    // 현장명 (필수)
  address?: string;                // 현장 주소
  managerName?: string;            // 현장 책임자
  managerPhone?: string;           // 현장 대표번호
  checkoutPolicy: CheckoutPolicy;  // 퇴근 모드
  autoHours: number;               // 자동 퇴근 기준 시간 (기본값 8)
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// 팀/협력업체 (Team = Partner)
// ============================================
// 이 프로젝트에서 '팀'과 '소속업체'는 동일한 개념
// DB 테이블: partners
export interface Team {
  id: number;
  companyId?: number;          // 소속 회사 (API 응답에서 필수)
  siteId?: number | null;      // 소속 현장 (null이면 회사 전체에 속한 팀)
  name: string;                // 팀명 (예: (주)정이앤지)
  contactName?: string;        // 담당자 이름
  contactPhone?: string;       // 담당자 연락처
  isExternal?: boolean;        // 협력업체 여부 (false면 자체 팀)
  isActive?: boolean;          // 활성화 여부
  // 조인/집계 필드
  leaderId?: string;           // 팀 관리자 ID
  leaderName?: string;         // 팀 관리자 이름
  workerCount?: number;        // 팀원 수
  createdAt?: string;
  updatedAt?: string;
}

// Partner는 Team의 별칭 (하위 호환성)
export type Partner = Team;

// ============================================
// 근로자 상태
// ============================================
export type WorkerStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';  // 활성/비활성/승인대기
export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'NOT_TODAY';  // 출근중/퇴근/미출근

// ============================================
// 근로자 (Worker)
// ============================================
export interface Worker {
  id: string;
  // 기본 정보
  name: string;                  // 이름
  phone: string;                 // 휴대폰 번호
  birthDate: string;             // 생년월일 (YYYYMMDD 또는 YYYY-MM-DD)
  age?: number;                  // 나이 (계산값)
  isSenior?: boolean;            // 고령자 여부 (65세 이상)

  // 소속 정보
  siteId: number;                // 소속 현장
  teamId: number;                // 소속 팀(업체)
  teamName?: string;             // 팀명 (조인용)

  // 직책/역할
  role: UserRole;                // 시스템 권한 (TEAM_ADMIN / WORKER)
  position?: string;             // 직책/직종 (예: 공사기사, 안전관리자, 일반근로자)
  isRepresentative?: boolean;    // 근로자 대표 여부

  // 추가 정보
  nationality?: string;          // 국적 (기본값: 대한민국)
  gender?: 'M' | 'F';            // 성별 (기본값: M)

  // 상태
  status: WorkerStatus;          // 등록 상태
  attendanceStatus?: AttendanceStatus;  // 오늘 출퇴근 상태

  // 근무 현황 (집계값)
  totalWorkDays?: number;        // 누적 근무 일수
  monthlyWorkDays?: number;      // 이번 달 근무 일수

  // 메타
  registeredAt?: string;         // 등록일
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// 비상연락처
// ============================================
export interface EmergencyContact {
  id?: number;
  workerId: string;
  name: string;                  // 이름
  phone: string;                 // 연락처
  relationship: string;          // 관계 (예: 배우자, 부모, 자녀)
}

// ============================================
// 건강정보
// ============================================
export interface HealthInfo {
  workerId: string;
  bloodType?: string;            // 혈액형 (A, B, O, AB, Rh+/-)
  smokingPerDay?: number;        // 하루 흡연량 (개비)
  drinkingPerWeek?: number;      // 1주일 음주 횟수
  drinkingAmount?: string;       // 음주 1회 섭취량
  bloodPressureHigh?: number;    // 최고혈압 (mmHg)
  bloodPressureLow?: number;     // 최저혈압 (mmHg)
  hasChronicDisease?: boolean;   // 기저질환 여부
  chronicDiseaseNote?: string;   // 기저질환 상세
}

// ============================================
// 채용 서류 (최대 10개)
// ============================================
export type DocumentType =
  | 'SAFETY_PLEDGE'              // 안전관리서약서
  | 'TRAINING_CERT'              // 교육이수및보호구수령확인서
  | 'PRIVACY_CONSENT'            // 개인정보수집이용동의서
  | 'HEALTH_QUESTIONNAIRE'       // 건강문진표
  | 'SAFETY_EDUCATION_CERT'      // 기초안전보건교육증
  | 'LICENSE'                    // 자격증
  | 'OTHER';                     // 기타

export interface WorkerDocument {
  id?: number;
  workerId: string;
  type: DocumentType;
  name: string;                  // 파일명
  url: string;                   // 파일 URL
  uploadedAt?: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  SAFETY_PLEDGE: '안전관리서약서',
  TRAINING_CERT: '교육이수및보호구수령확인서',
  PRIVACY_CONSENT: '개인정보수집이용동의서',
  HEALTH_QUESTIONNAIRE: '건강문진표',
  SAFETY_EDUCATION_CERT: '기초안전보건교육증',
  LICENSE: '자격증',
  OTHER: '기타',
};

// ============================================
// 출퇴근 기록 (Attendance)
// ============================================
export interface AttendanceRecord {
  id: number;
  workDate: string;          // 작업일 (YYYY-MM-DD)
  siteId: number;
  partnerId: number;
  workerName: string;
  role: UserRole;
  birthDate: string;         // 생년월일 (YYYY-MM-DD)
  age: number;               // 나이 (출근 시점 기준)
  isSenior: boolean;         // 65세 이상 여부
  checkInTime: string | null;   // 출근 시간 (HH:mm:ss)
  checkOutTime: string | null;  // 퇴근 시간 (HH:mm:ss)
  isAutoOut: boolean;        // 자동 퇴근 처리 여부
  hasAccident: boolean;      // 사고 발생 여부
}

// ============================================
// 대시보드 집계 데이터
// ============================================
export interface DashboardSummary {
  totalWorkers: number;      // 총 출근 인원
  managerCount: number;      // 관리자 수
  workerCount: number;       // 근로자 수
  seniorCount: number;       // 고령자 수 (65세+)
  seniorRatio: number;       // 고령자 비율 (%)
  checkoutRate: number;      // 퇴근율 (%)
  accidentCount: number;     // 사고 건수
}

// ============================================
// 소속별 인원 현황 (차트용)
// ============================================
export interface PartnerAttendance {
  partnerId: number;
  partnerName: string;
  managerCount: number;
  workerCount: number;
  total: number;
}

// ============================================
// QR 코드 페이로드
// ============================================
export interface QRPayload {
  workerId: string;          // 근로자 고유 ID
  timestamp: number;         // 생성 시간 (Unix timestamp)
  expiresAt: number;         // 만료 시간 (Unix timestamp)
  signature: string;         // 위변조 방지 서명
}

// ============================================
// 인증 관련 타입 (auth.ts)
// ============================================
export * from './auth';
