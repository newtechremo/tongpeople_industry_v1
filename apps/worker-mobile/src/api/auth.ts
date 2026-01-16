/**
 * 인증 API
 */
import { supabase } from '../lib/supabase';

// 회사코드로 회사 정보 조회
export async function getCompanyByCode(companyCode: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('company_code', companyCode.toUpperCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('존재하지 않는 회사코드입니다.');
    }
    throw new Error(error.message);
  }

  return data;
}

// 회사의 현장 목록 조회
export async function getSitesByCompany(companyId: number) {
  const { data, error } = await supabase
    .from('sites')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);
  return data || [];
}

// 현장의 팀 목록 조회
export async function getTeamsBySite(siteId: number) {
  const { data, error } = await supabase
    .from('partners')
    .select('id, name')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);
  return data || [];
}

// 회원가입 데이터 타입
export interface SignUpData {
  phone: string;
  password: string;
  name: string;
  birthDate: string;       // YYYY-MM-DD
  gender: 'M' | 'F';
  nationality: string;
  companyId: number;
  siteId: number;
  teamId: number;
  position?: string;
}

// 회원가입
export async function signUp(data: SignUpData) {
  // 1. Supabase Auth 계정 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    phone: data.phone,
    password: data.password,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new Error('이미 가입된 휴대폰 번호입니다.');
    }
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('계정 생성에 실패했습니다.');
  }

  // 2. users 테이블에 프로필 생성
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    company_id: data.companyId,
    site_id: data.siteId,
    partner_id: data.teamId,
    name: data.name,
    phone: data.phone,
    birth_date: data.birthDate,
    gender: data.gender,
    nationality: data.nationality,
    position: data.position,
    role: 'WORKER',
    status: 'REQUESTED',  // 승인 대기 상태
    is_active: false,     // 승인 전까지 비활성
  });

  if (profileError) {
    // 프로필 생성 실패 시 Auth 계정도 삭제 시도 (롤백)
    console.error('[SignUp] 프로필 생성 실패:', profileError.message);
    throw new Error('회원정보 저장에 실패했습니다. 다시 시도해주세요.');
  }

  return authData;
}

// 로그인
export async function signIn(phone: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    phone,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('휴대폰 번호 또는 비밀번호가 올바르지 않습니다.');
    }
    throw new Error(error.message);
  }

  return data;
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// 현재 사용자 조회
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return user;
}
