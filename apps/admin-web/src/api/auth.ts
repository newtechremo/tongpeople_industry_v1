import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SITE_ADMIN' | 'TEAM_ADMIN' | 'WORKER';
  companyId: number | null;
  siteId: number | null;
  partnerId: number | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      phone: string;
      role: string;
    };
    company: { id: number; name: string } | null;
    site: { id: number; name: string } | null;
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
  error?: string;
}

export interface SmsResponse {
  success: boolean;
  message: string;
  code?: string; // 개발 환경에서만 반환
  expiresIn?: number;
  error?: string;
}

export interface VerifyResponse {
  success: boolean;
  message: string;
  verificationToken?: string;
  error?: string;
  remainingAttempts?: number;
}

export interface SignupRequest {
  verificationToken: string;
  name: string;
  phone: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed?: boolean;
  companyName: string;
  businessNumber: string;
  ceoName: string;
  companyAddress: string;
  employeeCountRange?: string;
  siteName: string;
  siteAddress?: string;
  checkoutPolicy?: 'AUTO_8H' | 'MANUAL';
  autoHours?: number;
  password: string;
}

/**
 * SMS 인증코드 발송
 */
export async function sendSms(
  phone: string,
  purpose: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET'
): Promise<SmsResponse> {
  const response = await fetch(`${FUNCTIONS_URL}/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ phone, purpose }),
  });

  return response.json();
}

/**
 * SMS 인증코드 확인
 */
export async function verifySms(
  phone: string,
  code: string,
  purpose: 'SIGNUP' | 'LOGIN' | 'PASSWORD_RESET'
): Promise<VerifyResponse> {
  const response = await fetch(`${FUNCTIONS_URL}/verify-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ phone, code, purpose }),
  });

  return response.json();
}

/**
 * 관리자 회원가입
 */
export async function signup(data: SignupRequest): Promise<{ success: boolean; message: string; error?: string }> {
  console.log('[signup] 요청 시작:', { ...data, password: '***' });

  try {
    const response = await fetch(`${FUNCTIONS_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data),
    });

    console.log('[signup] 응답 상태:', response.status, response.statusText);

    // 응답 텍스트 먼저 확인
    const responseText = await response.text();
    console.log('[signup] 응답 내용:', responseText);

    // JSON 파싱 시도
    try {
      const result = JSON.parse(responseText);

      if (!response.ok) {
        return {
          success: false,
          message: result.error || '회원가입에 실패했습니다.',
          error: result.error,
        };
      }

      return result;
    } catch (parseError) {
      console.error('[signup] JSON 파싱 실패:', parseError);
      return {
        success: false,
        message: '서버 응답을 처리할 수 없습니다.',
        error: responseText,
      };
    }
  } catch (fetchError) {
    console.error('[signup] 네트워크 오류:', fetchError);
    return {
      success: false,
      message: '서버에 연결할 수 없습니다.',
      error: fetchError instanceof Error ? fetchError.message : '네트워크 오류',
    };
  }
}

/**
 * 휴대폰 번호 + 비밀번호로 로그인
 */
export async function login(phone: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${FUNCTIONS_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ phone, password }),
  });

  const result: LoginResponse = await response.json();

  // 로그인 성공 시 Supabase 세션 설정
  if (result.success && result.data?.session) {
    await supabase.auth.setSession({
      access_token: result.data.session.access_token,
      refresh_token: result.data.session.refresh_token,
    });
  }

  return result;
}

/**
 * 비밀번호 재설정
 */
export async function resetPassword(
  verificationToken: string,
  phone: string,
  newPassword: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const response = await fetch(`${FUNCTIONS_URL}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ verificationToken, phone, newPassword }),
  });

  return response.json();
}

/**
 * 사업자등록번호 중복 확인
 */
export async function checkBusinessNumber(businessNumber: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const normalizedBizNum = businessNumber.replace(/[^0-9]/g, '');

    const { data, error } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('biz_num', normalizedBizNum)
      .maybeSingle();

    if (error) {
      console.error('Business number check error:', error);
      return { exists: false, error: '중복 확인 중 오류가 발생했습니다.' };
    }

    return { exists: !!data };
  } catch {
    return { exists: false, error: '중복 확인 중 오류가 발생했습니다.' };
  }
}

/**
 * 로그아웃
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 현재 세션 확인
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * 현재 사용자 정보 조회 (users 테이블 포함)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // users 테이블에서 추가 정보 조회
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Failed to fetch user profile:', profileError);
    return null;
  }

  return {
    id: user.id,
    phone: profile.phone || '',
    name: profile.name,
    role: profile.role,
    companyId: profile.company_id,
    siteId: profile.site_id,
    partnerId: profile.partner_id,
  };
}

/**
 * 인증 상태 변경 구독
 */
export function onAuthStateChange(
  callback: (event: string, session: SupabaseUser | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user || null);
  });
}

/**
 * 권한 체크 유틸리티
 */
export function hasPermission(
  user: AuthUser | null,
  requiredRole: 'SUPER_ADMIN' | 'SITE_ADMIN' | 'TEAM_ADMIN' | 'WORKER'
): boolean {
  if (!user) return false;

  const roleHierarchy = {
    SUPER_ADMIN: 4,
    SITE_ADMIN: 3,
    TEAM_ADMIN: 2,
    WORKER: 1,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}
