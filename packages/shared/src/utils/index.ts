/**
 * 산업현장통 - 공통 유틸 함수
 */

import { SENIOR_AGE_THRESHOLD, WORK_DAY_START_HOUR } from '../constants';

// ============================================
// 나이 계산
// ============================================

/**
 * 생년월일로 만 나이 계산
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 * @param baseDate - 기준일 (기본값: 오늘)
 */
export function calculateAge(birthDate: string, baseDate: Date = new Date()): number {
  const birth = new Date(birthDate);
  let age = baseDate.getFullYear() - birth.getFullYear();

  const monthDiff = baseDate.getMonth() - birth.getMonth();
  const dayDiff = baseDate.getDate() - birth.getDate();

  // 생일이 아직 안 지났으면 1살 빼기
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

/**
 * 고령자 여부 판단 (만 65세 이상)
 */
export function isSenior(birthDate: string, baseDate: Date = new Date()): boolean {
  return calculateAge(birthDate, baseDate) >= SENIOR_AGE_THRESHOLD;
}

// ============================================
// 근무일 계산
// ============================================

/**
 * 현재 시간 기준 근무일 계산
 * 04:00 기준으로 날짜 결정 (04:00 이전이면 전날)
 */
export function getWorkDate(now: Date = new Date()): string {
  const adjusted = new Date(now);

  // 04:00 이전이면 전날로 처리
  if (adjusted.getHours() < WORK_DAY_START_HOUR) {
    adjusted.setDate(adjusted.getDate() - 1);
  }

  return formatDate(adjusted);
}

/**
 * 날짜 포맷 (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 시간 포맷 (HH:mm:ss)
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// ============================================
// 퇴근율 계산
// ============================================

/**
 * 퇴근율 계산 (%)
 * @param checkedIn - 출근 인원
 * @param checkedOut - 퇴근 인원
 */
export function calculateCheckoutRate(checkedIn: number, checkedOut: number): number {
  if (checkedIn === 0) return 0;
  return Math.round((checkedOut / checkedIn) * 100);
}

// ============================================
// 자동 퇴근 시간 계산
// ============================================

/**
 * 자동 퇴근 시간 계산
 * @param checkInTime - 출근 시간 (HH:mm:ss)
 * @param autoHours - 자동 퇴근 시간 (기본 8시간)
 */
export function calculateAutoCheckoutTime(checkInTime: string, autoHours: number = 8): string {
  const [hours, minutes, seconds] = checkInTime.split(':').map(Number);

  const checkIn = new Date();
  checkIn.setHours(hours, minutes, seconds, 0);

  const checkOut = new Date(checkIn.getTime() + autoHours * 60 * 60 * 1000);

  return formatTime(checkOut);
}
