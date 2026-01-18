import { supabase, Tables } from '../lib/supabase';

export type Company = Tables<'companies'>;
export type ClientProfile = Tables<'client_profiles'>;

export interface CompanyWithProfile extends Company {
  client_profile?: ClientProfile;
}

/**
 * 회사 정보 조회 (client_profile 포함)
 */
export async function getCompanyById(companyId: number): Promise<CompanyWithProfile | null> {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      client_profile:client_profiles(*)
    `)
    .eq('id', companyId)
    .single();

  if (error) {
    console.error('Failed to fetch company:', error);
    return null;
  }

  return data;
}

/**
 * 회사 정보 업데이트
 */
export async function updateCompany(companyId: number, updates: {
  name?: string;
  ceo_name?: string;
  address?: string;
  employee_count_range?: string;
  business_category_code?: string;
  business_category_name?: string;
  contact_phone?: string;
}) {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * client_profiles 업데이트 (담당자 정보)
 */
export async function updateClientProfile(companyId: number, updates: {
  admin_name?: string;
  admin_phone?: string;
  admin_email?: string;
  billing_name?: string;
  billing_phone?: string;
  billing_email?: string;
}) {
  // client_profile 존재 여부 확인
  const { data: existingProfile } = await supabase
    .from('client_profiles')
    .select('id')
    .eq('company_id', companyId)
    .single();

  if (existingProfile) {
    // 업데이트
    const { data, error } = await supabase
      .from('client_profiles')
      .update(updates)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // 생성
    const { data, error } = await supabase
      .from('client_profiles')
      .insert({
        company_id: companyId,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * 회사 코드 생성 (6자리 영문+숫자, 혼동 문자 제외)
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // I, O, 0, 1 제외
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

/**
 * 회사 코드 비활성화
 */
export async function deactivateCompanyCode(companyId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('company_codes')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('회사코드 비활성화 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '회사코드 비활성화 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 회사 코드 조회 (company_codes 테이블에서)
 */
export async function getCompanyCode(companyId: number): Promise<{
  success: boolean;
  code?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('company_codes')
      .select('code')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // 코드가 없으면 자동 생성
      if (error.code === 'PGRST116') {
        return await regenerateCompanyCode(companyId);
      }
      return { success: false, error: error.message };
    }

    return { success: true, code: data.code };
  } catch (error) {
    console.error('회사코드 조회 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '회사코드 조회 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 회사 코드 재생성 (기존 코드 비활성화 후 새 코드 생성)
 */
export async function regenerateCompanyCode(companyId: number): Promise<{
  success: boolean;
  code?: string;
  error?: string;
}> {
  try {
    // 1. 기존 활성 코드 비활성화
    await supabase
      .from('company_codes')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .eq('is_active', true);

    // 2. 새 코드 생성 (중복 검사)
    let newCode = generateCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('company_codes')
        .select('code')
        .eq('code', newCode)
        .eq('is_active', true)
        .single();

      if (!existing) break; // 중복 없음
      newCode = generateCode(); // 중복이면 다시 생성
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return { success: false, error: '유니크 코드 생성 실패' };
    }

    // 3. 새 코드 삽입
    const { error: insertError } = await supabase
      .from('company_codes')
      .insert({
        company_id: companyId,
        code: newCode,
        is_active: true,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, code: newCode };
  } catch (error) {
    console.error('회사코드 재생성 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '회사코드 재생성 중 오류가 발생했습니다.'
    };
  }
}
