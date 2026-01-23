// 날짜 관련 유틸리티

// 근무일 시작 시간 (기본값: 04:00)
const DEFAULT_WORK_DAY_START_HOUR = 4;

/**
 * 현재 근무일 계산
 * 04:00 이전이면 전날이 근무일
 * @param now 기준 시간 (기본값: 현재)
 * @param startHour 근무일 시작 시간 (기본값: 4)
 * @returns YYYY-MM-DD 형식의 근무일
 */
export function getWorkDate(
  now: Date = new Date(),
  startHour: number = DEFAULT_WORK_DAY_START_HOUR
): string {
  const hour = now.getHours();
  const date = new Date(now);

  // 시작 시간 이전이면 전날이 근무일
  if (hour < startHour) {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString().split('T')[0];
}

/**
 * 만 나이 계산
 * @param birthDate YYYYMMDD 또는 YYYY-MM-DD 형식
 * @param baseDate 기준일 (기본값: 오늘)
 * @returns 만 나이
 */
export function calculateAge(birthDate: string, baseDate: Date = new Date()): number {
  // YYYYMMDD -> YYYY-MM-DD 변환
  const normalized = birthDate.includes('-')
    ? birthDate
    : `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`;

  const birth = new Date(normalized);
  let age = baseDate.getFullYear() - birth.getFullYear();
  const monthDiff = baseDate.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && baseDate.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 고령자 여부 확인 (만 65세 이상)
 * @param birthDate YYYYMMDD 또는 YYYY-MM-DD 형식
 * @param seniorAge 고령자 기준 나이 (기본값: 65)
 * @returns 고령자 여부
 */
export function isSenior(birthDate: string, seniorAge: number = 65): boolean {
  return calculateAge(birthDate) >= seniorAge;
}

/**
 * 생년월일 형식 변환 (YYYYMMDD -> YYYY-MM-DD)
 */
export function formatBirthDate(birthDate: string): string {
  if (birthDate.includes('-')) {
    return birthDate;
  }

  if (birthDate.length !== 8) {
    throw new Error('Invalid birth date format. Expected YYYYMMDD.');
  }

  return `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`;
}

/**
 * 근무 시간 계산 (분 단위)
 * @param checkInTime 출근 시간
 * @param checkOutTime 퇴근 시간
 * @returns 근무 시간 (분)
 */
export function calculateWorkDuration(
  checkInTime: string | Date,
  checkOutTime: string | Date
): number {
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.floor(diff / (1000 * 60));
}
