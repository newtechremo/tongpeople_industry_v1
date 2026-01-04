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

  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive);
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
    .update({ is_active: false })
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
    .eq('is_active', true);

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
