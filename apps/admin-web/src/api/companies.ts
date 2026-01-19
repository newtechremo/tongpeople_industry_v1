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
