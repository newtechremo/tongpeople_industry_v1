import { supabase, Tables, TablesInsert, TablesUpdate } from '../lib/supabase';

export type Attendance = Tables<'attendance'>;
export type AttendanceInsert = TablesInsert<'attendance'>;
export type AttendanceUpdate = TablesUpdate<'attendance'>;

// 확장된 출퇴근 타입 (조인 데이터 포함)
export interface AttendanceWithDetails extends Attendance {
  partnerName?: string;
}

/**
 * 출퇴근 기록 조회
 */
export async function getAttendanceRecords(options: {
  siteId: number;
  workDate: string;
  partnerId?: number;
  search?: string;
}) {
  let query = supabase
    .from('attendance')
    .select(`
      *,
      partners:partner_id(name)
    `)
    .eq('site_id', options.siteId)
    .eq('work_date', options.workDate)
    .order('check_in_time', { ascending: false });

  if (options.partnerId) {
    query = query.eq('partner_id', options.partnerId);
  }

  if (options.search) {
    query = query.ilike('worker_name', `%${options.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data?.map(record => ({
    ...record,
    partnerName: (record.partners as { name: string } | null)?.name,
    partners: undefined,
  })) as AttendanceWithDetails[];
}

/**
 * 출퇴근 기록 상세 조회
 */
export async function getAttendanceById(id: number) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      partners:partner_id(name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    ...data,
    partnerName: (data.partners as { name: string } | null)?.name,
    partners: undefined,
  } as AttendanceWithDetails;
}

/**
 * 출근 처리 (QR 스캔)
 */
export async function checkIn(data: AttendanceInsert) {
  const { data: result, error } = await supabase
    .from('attendance')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * 퇴근 처리
 */
export async function checkOut(id: number, isAutoOut: boolean = false) {
  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out_time: new Date().toISOString(),
      is_auto_out: isAutoOut,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 출퇴근 기록 수정
 */
export async function updateAttendance(id: number, attendance: AttendanceUpdate) {
  const { data, error } = await supabase
    .from('attendance')
    .update(attendance)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 대시보드 요약 데이터 조회
 */
export async function getDashboardSummary(siteId: number, workDate: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('site_id', siteId)
    .eq('work_date', workDate);

  if (error) throw error;

  const records = data || [];

  const totalWorkers = records.length;
  const managerCount = records.filter(r =>
    r.role === 'SITE_ADMIN' || r.role === 'TEAM_ADMIN'
  ).length;
  const workerCount = totalWorkers - managerCount;
  const seniorCount = records.filter(r => r.is_senior).length;
  const checkedOutCount = records.filter(r => r.check_out_time).length;
  const accidentCount = records.filter(r => r.has_accident).length;

  return {
    totalWorkers,
    managerCount,
    workerCount,
    seniorCount,
    seniorRatio: totalWorkers > 0 ? Math.round((seniorCount / totalWorkers) * 100) : 0,
    checkoutRate: totalWorkers > 0 ? Math.round((checkedOutCount / totalWorkers) * 100) : 0,
    accidentCount,
  };
}

/**
 * 팀별 출퇴근 현황 조회
 */
export async function getAttendanceByPartner(siteId: number, workDate: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      partner_id,
      role,
      partners:partner_id(name)
    `)
    .eq('site_id', siteId)
    .eq('work_date', workDate);

  if (error) throw error;

  // 팀별 집계
  const partnerMap = new Map<number, {
    partnerId: number;
    partnerName: string;
    managerCount: number;
    workerCount: number;
    total: number;
  }>();

  data?.forEach(record => {
    if (!record.partner_id) return;

    const partnerName = (record.partners as { name: string } | null)?.name || '미지정';

    if (!partnerMap.has(record.partner_id)) {
      partnerMap.set(record.partner_id, {
        partnerId: record.partner_id,
        partnerName,
        managerCount: 0,
        workerCount: 0,
        total: 0,
      });
    }

    const stats = partnerMap.get(record.partner_id)!;
    stats.total++;

    if (record.role === 'SITE_ADMIN' || record.role === 'TEAM_ADMIN') {
      stats.managerCount++;
    } else {
      stats.workerCount++;
    }
  });

  return Array.from(partnerMap.values());
}

/**
 * 실시간 출퇴근 현황 (출근중 인원)
 */
export async function getActiveAttendance(siteId: number, workDate: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      partners:partner_id(name)
    `)
    .eq('site_id', siteId)
    .eq('work_date', workDate)
    .is('check_out_time', null)
    .order('check_in_time', { ascending: false });

  if (error) throw error;

  return data?.map(record => ({
    ...record,
    partnerName: (record.partners as { name: string } | null)?.name,
    partners: undefined,
  })) as AttendanceWithDetails[];
}

/**
 * 근로자 + 출퇴근 현황 조회 (출근 여부 관계없이 ACTIVE 근로자 모두 표시)
 */
export async function getWorkersWithAttendance(options: {
  siteId: number;
  workDate: string;
  partnerId?: number;
  search?: string;
}) {
  // 1. 해당 site의 ACTIVE 근로자 조회
  let workersQuery = supabase
    .from('users')
    .select(`
      id,
      name,
      phone,
      birth_date,
      gender,
      job_title,
      role,
      partner_id,
      partners:partner_id(name)
    `)
    .eq('site_id', options.siteId)
    .eq('status', 'ACTIVE');

  if (options.partnerId) {
    workersQuery = workersQuery.eq('partner_id', options.partnerId);
  }

  if (options.search) {
    workersQuery = workersQuery.ilike('name', `%${options.search}%`);
  }

  const { data: workers, error: workersError } = await workersQuery;
  if (workersError) throw workersError;

  // 2. 해당 날짜의 출퇴근 기록 조회
  const { data: attendances, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .eq('site_id', options.siteId)
    .eq('work_date', options.workDate);

  if (attendanceError) throw attendanceError;

  // 3. user_id로 attendance 매핑
  const attendanceMap = new Map(
    attendances?.map(a => [a.user_id, a]) || []
  );

  // 4. 나이 계산 함수
  const calculateAge = (birthDate: string | null): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 5. 근로자 목록 + 출퇴근 정보 합치기
  return workers?.map(worker => {
    const attendance = attendanceMap.get(worker.id);
    const age = calculateAge(worker.birth_date);
    const isSenior = age >= 65;

    return {
      id: attendance?.id || 0,
      worker_id: worker.id,
      worker_name: worker.name,
      partnerName: (worker.partners as { name: string } | null)?.name || '미지정',
      position: worker.job_title || '일반근로자',
      birth_date: worker.birth_date,
      age,
      is_senior: isSenior,
      role: worker.role,
      check_in_time: attendance?.check_in_time || null,
      check_out_time: attendance?.check_out_time || null,
      is_auto_out: attendance?.is_auto_out || false,
      has_attendance: !!attendance, // 출근 기록 여부
    };
  }) || [];
}

/**
 * QR 페이로드 타입
 */
export interface QRPayload {
  workerId: string;
  timestamp: number;
  expiresAt: number;
  signature: string;
}

/**
 * QR 스캔 출근 처리 응답
 */
export interface CheckInResponse {
  success: boolean;
  message: string;
  data?: {
    worker_name: string;
    partner_name?: string;
    check_in_time: string;
    check_out_time?: string;
    is_auto_out: boolean;
    is_senior: boolean;
  };
  error?: string;
}

/**
 * QR 스캔으로 출근 처리 (Edge Function 호출)
 */
export async function checkInWithQR(
  siteId: number,
  qrPayload: QRPayload
): Promise<CheckInResponse> {
  const { data, error } = await supabase.functions.invoke('check-in', {
    body: {
      site_id: siteId,
      qr_payload: qrPayload,
    },
  });

  if (error) {
    throw new Error(error.message || '출근 처리에 실패했습니다.');
  }

  // Edge Function이 에러를 반환한 경우
  if (data?.error) {
    throw new Error(data.error);
  }

  return data as CheckInResponse;
}
