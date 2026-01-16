/**
 * 출퇴근 기록 API
 */
import { supabase } from '../lib/supabase';

export interface AttendanceRecord {
  id: number;
  user_id: string;
  site_id: number;
  partner_id: number | null;
  work_date: string;
  check_in_time: string;
  check_out_time: string | null;
  is_senior: boolean;
  is_auto_out: boolean;
  has_accident: boolean;
  created_at: string;
  // Join된 데이터
  site_name?: string;
  partner_name?: string;
}

export interface AttendanceSummary {
  workDays: number;
  totalHours: number;
  attendanceRate: number;
}

/**
 * 내 출퇴근 기록 조회
 */
export async function getMyAttendance(
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      sites:site_id (name),
      partners:partner_id (name)
    `)
    .eq('user_id', user.id)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .order('work_date', { ascending: false });

  if (error) throw error;

  // 데이터 변환
  return (data || []).map((record: any) => ({
    ...record,
    site_name: record.sites?.name,
    partner_name: record.partners?.name,
  }));
}

/**
 * 오늘의 출퇴근 기록 조회
 */
export async function getTodayAttendance(): Promise<AttendanceRecord | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  // 근무일 기준 (04:00 ~ 익일 03:59)
  const now = new Date();
  const hour = now.getHours();

  // 04:00 이전이면 전날 날짜 사용
  if (hour < 4) {
    now.setDate(now.getDate() - 1);
  }

  const workDate = now.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      sites:site_id (name),
      partners:partner_id (name)
    `)
    .eq('user_id', user.id)
    .eq('work_date', workDate)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

  if (!data) return null;

  return {
    ...data,
    site_name: data.sites?.name,
    partner_name: data.partners?.name,
  };
}

/**
 * 이번 달 출퇴근 요약
 */
export async function getMonthSummary(year: number, month: number): Promise<AttendanceSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const { data, error } = await supabase
    .from('attendance')
    .select('work_date, check_in_time, check_out_time')
    .eq('user_id', user.id)
    .gte('work_date', startDate)
    .lte('work_date', endDate);

  if (error) throw error;

  const records = data || [];
  const workDays = records.length;

  // 총 근무시간 계산
  let totalMinutes = 0;
  records.forEach((record) => {
    if (record.check_in_time && record.check_out_time) {
      const checkIn = new Date(`${record.work_date}T${record.check_in_time}`);
      const checkOut = new Date(`${record.work_date}T${record.check_out_time}`);
      const diff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60);
      if (diff > 0) {
        totalMinutes += diff;
      }
    }
  });

  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  // 출석률 계산 (해당 월의 평일 수 기준)
  const weekdaysInMonth = getWeekdaysInMonth(year, month);
  const attendanceRate = weekdaysInMonth > 0
    ? Math.round((workDays / weekdaysInMonth) * 100)
    : 0;

  return {
    workDays,
    totalHours,
    attendanceRate,
  };
}

/**
 * 해당 월의 평일 수 계산
 */
function getWeekdaysInMonth(year: number, month: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  let weekdays = 0;

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    // 월~금 (1~5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays++;
    }
  }

  return weekdays;
}

/**
 * 날짜 범위 헬퍼
 */
export function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { startDate, endDate };
}

/**
 * 오늘 날짜 (근무일 기준)
 */
export function getWorkDate(): string {
  const now = new Date();
  const hour = now.getHours();

  // 04:00 이전이면 전날 날짜 사용
  if (hour < 4) {
    now.setDate(now.getDate() - 1);
  }

  return now.toISOString().split('T')[0];
}
