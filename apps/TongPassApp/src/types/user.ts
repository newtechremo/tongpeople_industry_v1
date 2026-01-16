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
  phoneNumber: string;
  name: string;
  birthDate: string; // YYYYMMDD
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
  createdAt: string;
}

// 선등록 데이터
export interface PreRegisteredData {
  name: string;
  birthDate: string;
  gender: Gender;
  nationality: string;
  teamId: string;
  jobTitle: string;
  preRegistered: true;
}
