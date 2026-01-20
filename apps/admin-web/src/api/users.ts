import { supabase, Tables } from '../lib/supabase';

export type UserProfile = Tables<'users'>;

export interface AdminUser extends UserProfile {
  company?: {
    id: number;
    name: string;
  };
  site?: {
    id: number;
    name: string;
  };
  partner?: {
    id: number;
    name: string;
  };
}

/**
 * 관리자 목록 조회 (SUPER_ADMIN, SITE_ADMIN)
 */
export async function getAdminUsers(companyId: number): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      company:companies(id, name),
      site:sites(id, name),
      partner:partners(id, name)
    `)
    .eq('company_id', companyId)
    .in('role', ['SUPER_ADMIN', 'SITE_ADMIN'])
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * 관리자 추가
 */
export async function createAdminUser(admin: {
  name: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'SITE_ADMIN';
  companyId: number;
  siteId?: number;
  password: string;
}): Promise<AdminUser> {
  // 이 함수는 Edge Function을 통해 구현되어야 함
  // auth.users 생성 권한이 필요하기 때문
  throw new Error('관리자 추가는 Edge Function을 통해 구현 예정입니다.');
}

/**
 * 관리자 삭제
 */
export async function deleteAdminUser(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * 관리자 수정
 */
export async function updateAdminUser(userId: string, updates: {
  name?: string;
  phone?: string;
  role?: 'SUPER_ADMIN' | 'SITE_ADMIN';
  siteId?: number;
}) {
  const { data, error } = await supabase
    .from('users')
    .update({
      name: updates.name,
      phone: updates.phone,
      role: updates.role,
      site_id: updates.siteId,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 사용자의 근로자 목록 제외 설정 업데이트
 */
export async function updateUserExcludeFromList(
  userId: string,
  excludeFromList: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ exclude_from_list: excludeFromList })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('근로자 목록 제외 설정 업데이트 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '설정 업데이트 중 오류가 발생했습니다.'
    };
  }
}
