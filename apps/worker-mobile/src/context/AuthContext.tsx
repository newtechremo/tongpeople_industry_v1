/**
 * 인증 컨텍스트
 *
 * 사용자 로그인 상태 및 WorkerStatus 관리
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { WorkerStatus } from '@tong-pass/shared';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// 사용자 프로필 타입
interface UserProfile {
  id: string;
  companyId: number | null;
  siteId: number | null;
  partnerId: number | null;
  name: string;
  phone: string | null;
  birthDate: string | null;
  role: string;
  status: WorkerStatus;
  isActive: boolean;
}

// Auth 상태 타입
interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  status: WorkerStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Auth 컨텍스트 타입
interface AuthContextType extends AuthState {
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    status: 'PENDING',
    isLoading: true,
    isAuthenticated: false,
  });

  // 사용자 프로필 조회
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] 프로필 조회 실패:', error.message);
        return null;
      }

      return {
        id: data.id,
        companyId: data.company_id,
        siteId: data.site_id,
        partnerId: data.partner_id,
        name: data.name,
        phone: data.phone,
        birthDate: data.birth_date,
        role: data.role,
        status: data.status || 'PENDING',
        isActive: data.is_active,
      };
    } catch (error) {
      console.error('[Auth] 프로필 조회 예외:', error);
      return null;
    }
  }, []);

  // 세션 업데이트 처리
  const handleSessionChange = useCallback(async (session: Session | null) => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      setState({
        user: profile,
        session,
        status: profile?.status || 'PENDING',
        isLoading: false,
        isAuthenticated: !!profile,
      });
    } else {
      setState({
        user: null,
        session: null,
        status: 'PENDING',
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, [fetchUserProfile]);

  // 초기화 및 Auth 리스너
  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
    });

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleSessionChange(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSessionChange]);

  // 로그인
  const signIn = async (phone: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    const { error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });

    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error(error.message);
    }
  };

  // 로그아웃
  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      status: 'PENDING',
      isLoading: false,
      isAuthenticated: false,
    });
  };

  // 프로필 새로고침
  const refreshProfile = async () => {
    if (state.session?.user) {
      const profile = await fetchUserProfile(state.session.user.id);
      if (profile) {
        setState(prev => ({
          ...prev,
          user: profile,
          status: profile.status,
        }));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
