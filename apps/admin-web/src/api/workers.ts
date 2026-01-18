import { supabase, Tables, TablesInsert, TablesUpdate } from '../lib/supabase';
import type { UserRole } from '@tong-pass/shared';

export type User = Tables<'users'>;
export type UserInsert = TablesInsert<'users'>;
export type UserUpdate = TablesUpdate<'users'>;

// 확장된 근로자 타입 (조인 데이터 포함)
export interface WorkerWithDetails extends User {
  partnerName?: string;
  siteName?: string;
  age?: number;
  isSenior?: boolean;
}

/**
 * 근로자 목록 조회
 */
export async function getWorkers(options?: {
  siteId?: number;
  partnerId?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}) {
  let query = supabase
    .from('users')
    .select(`
      *,
      partners:partner_id(name),
      sites:site_id(name)
    `)
    .order('name');

  if (options?.siteId) {
    query = query.eq('site_id', options.siteId);
  }

  if (options?.partnerId) {
    query = query.eq('partner_id', options.partnerId);
  }

  if (options?.role) {
    query = query.eq('role', options.role);
  }

  // ACTIVE 상태만 조회 (PENDING, REQUESTED는 제외)
  if (options?.isActive !== undefined && options.isActive) {
    query = query.eq('status', 'ACTIVE');
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,phone.ilike.%${options.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // 결과 변환
  return data?.map(user => ({
    ...user,
    partnerName: (user.partners as { name: string } | null)?.name,
    siteName: (user.sites as { name: string } | null)?.name,
    age: user.birth_date ? calculateAge(user.birth_date) : undefined,
    isSenior: user.birth_date ? calculateAge(user.birth_date) >= 65 : false,
    // 조인 데이터 제거
    partners: undefined,
    sites: undefined,
  })) as WorkerWithDetails[];
}

/**
 * 근로자 상세 조회
 */
export async function getWorkerById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      partners:partner_id(name),
      sites:site_id(name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  return {
    ...data,
    partnerName: (data.partners as { name: string } | null)?.name,
    siteName: (data.sites as { name: string } | null)?.name,
    age: data.birth_date ? calculateAge(data.birth_date) : undefined,
    isSenior: data.birth_date ? calculateAge(data.birth_date) >= 65 : false,
    partners: undefined,
    sites: undefined,
  } as WorkerWithDetails;
}

/**
 * 근로자 생성
 */
export async function createWorker(worker: UserInsert) {
  const { data, error } = await supabase
    .from('users')
    .insert(worker)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 근로자 수정
 */
export async function updateWorker(id: string, worker: UserUpdate) {
  const { data, error } = await supabase
    .from('users')
    .update(worker)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 근로자 삭제 (비활성화)
 */
export async function deleteWorker(id: string) {
  const { error } = await supabase
    .from('users')
    .update({ status: 'INACTIVE' })
    .eq('id', id);

  if (error) throw error;
}

/**
 * 현장별 근로자 통계
 */
export async function getWorkerStats(siteId: number) {
  const { data, error } = await supabase
    .from('users')
    .select('role, birth_date')
    .eq('site_id', siteId)
    .eq('status', 'ACTIVE');

  if (error) throw error;

  const now = new Date();
  let totalCount = 0;
  let managerCount = 0;
  let workerCount = 0;
  let seniorCount = 0;

  data?.forEach(user => {
    totalCount++;

    if (user.role === 'TEAM_ADMIN' || user.role === 'SITE_ADMIN') {
      managerCount++;
    } else {
      workerCount++;
    }

    if (user.birth_date) {
      const age = calculateAge(user.birth_date, now);
      if (age >= 65) {
        seniorCount++;
      }
    }
  });

  return {
    totalCount,
    managerCount,
    workerCount,
    seniorCount,
    seniorRatio: totalCount > 0 ? Math.round((seniorCount / totalCount) * 100) : 0,
  };
}

/**
 * 나이 계산 유틸리티
 */
function calculateAge(birthDate: string, baseDate: Date = new Date()): number {
  const birth = new Date(birthDate);
  let age = baseDate.getFullYear() - birth.getFullYear();
  const monthDiff = baseDate.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && baseDate.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 근로자 초대 (선등록 방식 A)
 */
export async function inviteWorker(data: {
  teamId: number;
  name: string;
  phone: string;
  birthDate: string;
  position: string;
  role: 'WORKER' | 'TEAM_ADMIN';
  nationality?: string;
  gender?: 'M' | 'F';
}): Promise<{
  success: boolean;
  message: string;
  data?: {
    userId: string;
    inviteToken: string;
    inviteLink: string;
  };
  error?: string;
}> {
  const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      return { success: false, message: '', error: '인증 토큰이 없습니다.' };
    }

    const response = await fetch(`${FUNCTIONS_URL}/invite-worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || '근로자 초대에 실패했습니다.',
        error: result.error,
      };
    }

    return result;
  } catch (error) {
    console.error('근로자 초대 실패:', error);
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : '근로자 초대 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 퇴사 사유 타입
 */
export type LeaveReason = 'RESIGNED' | 'TRANSFERRED' | 'FIRED';

/**
 * 근로자 이력 타입
 */
export interface WorkerHistory {
  id: number;
  companyId: number;
  companyName: string;
  siteId: number;
  siteName: string;
  partnerId: number;
  partnerName: string;
  role: string;
  joinedAt: string;
  leftAt: string;
  leaveReason: string;
}

/**
 * 근로자 퇴사 처리
 */
export async function terminateWorker(
  workerId: string,
  leaveReason: LeaveReason
): Promise<{ success: boolean; message: string; error?: string }> {
  const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL?.replace('supabase.co', 'supabase.co/functions/v1') || '';

  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      return { success: false, message: '', error: '인증 토큰이 없습니다.' };
    }

    const response = await fetch(`${FUNCTIONS_URL}/terminate-worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ workerId, leaveReason }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('퇴사 처리 실패:', error);
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : '퇴사 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 근로자 이력 조회
 */
export async function getWorkerHistory(
  workerId: string
): Promise<{
  success: boolean;
  data?: WorkerHistory[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('user_employment_history')
      .select(`
        id,
        company_id,
        site_id,
        partner_id,
        role,
        joined_at,
        left_at,
        leave_reason,
        companies!inner(name),
        sites(name),
        partners(name)
      `)
      .eq('user_id', workerId)
      .order('left_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data?.map(item => ({
        id: item.id,
        companyId: item.company_id,
        companyName: Array.isArray(item.companies) ? item.companies[0]?.name : item.companies?.name || '',
        siteId: item.site_id,
        siteName: Array.isArray(item.sites) ? item.sites[0]?.name : item.sites?.name || '',
        partnerId: item.partner_id,
        partnerName: Array.isArray(item.partners) ? item.partners[0]?.name : item.partners?.name || '',
        role: item.role,
        joinedAt: item.joined_at,
        leftAt: item.left_at,
        leaveReason: item.leave_reason,
      })) || []
    };
  } catch (error) {
    console.error('이력 조회 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '이력 조회 중 오류가 발생했습니다.'
    };
  }
}
