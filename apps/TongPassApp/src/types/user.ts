// 사용자 역할
export type UserRole = 'SUPER_ADMIN' | 'SITE_ADMIN' | 'TEAM_ADMIN' | 'WORKER';

// 근로자 상태
export type WorkerStatus =
  | 'PENDING'
  | 'REQUESTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BLOCKED';

// 출퇴근 상태
export type CommuteStatus = 'WORK_OFF' | 'WORK_ON' | 'WORK_DONE';

// 성별
export type Gender = 'M' | 'F';

// 근로자 정보
export interface Worker {
  id: string;
  phone: string; // 백엔드 응답 필드명
  phoneNumber?: string; // 레거시 호환
  name: string;
  birthDate: string; // YYYYMMDD 또는 YYYY-MM-DD
  isSenior: boolean; // 만 65세 이상
  email?: string;
  gender: Gender;
  nationality: string;
  jobTitle: string;
  status: WorkerStatus;
  role: UserRole;
  preRegistered: boolean;
  isDataConflict: boolean;
  signatureUrl?: string;
  companyId: string;
  siteId: string;
  teamId: string;
  partnerId?: string; // 백엔드 호환 (teamId와 동일)
  createdAt: string;
}

// 선등록 데이터
export interface PreRegisteredData {
  name: string;
  birthDate: string;
  gender: Gender;
  nationality: string;
  teamId: string;
  teamName?: string; // 팀 이름 (표시용)
  jobTitle: string;
  preRegistered: true;
}
