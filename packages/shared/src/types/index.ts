/**
 * 산업현장통 - 공통 타입 정의
 */

// ============================================
// 퇴근 정책
// ============================================
export type CheckoutPolicy = 'AUTO_8H' | 'MANUAL';

// ============================================
// 사용자 역할
// ============================================
export type UserRole = '관리자' | '근로자';

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
// 협력업체 (Partner)
// ============================================
export interface Partner {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

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
