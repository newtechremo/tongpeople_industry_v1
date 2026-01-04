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
