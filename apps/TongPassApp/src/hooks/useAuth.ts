/**
 * 인증 관련 훅
 * - 로그인/로그아웃 처리
 * - 인증 상태 관리
 */

import {useCallback} from 'react';
import {useRecoilState, useResetRecoilState} from 'recoil';
import {authState, AuthState} from '@/store/atoms/authAtom';
import {
  userInfoState,
  workerStatusState,
  commuteStatusState,
} from '@/store/atoms/userAtom';
import {
  selectedCompanyState,
  selectedSiteState,
  teamsState,
} from '@/store/atoms/companyAtom';
import {apiClient} from '@/api/client';

interface UseAuthReturn {
  auth: AuthState;
  isLoggedIn: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  updateTokens: (accessToken: string, refreshToken?: string) => void;
}

export function useAuth(): UseAuthReturn {
  const [auth, setAuth] = useRecoilState(authState);

  // 상태 초기화 함수들
  const resetUserInfo = useResetRecoilState(userInfoState);
  const resetWorkerStatus = useResetRecoilState(workerStatusState);
  const resetCommuteStatus = useResetRecoilState(commuteStatusState);
  const resetCompany = useResetRecoilState(selectedCompanyState);
  const resetSite = useResetRecoilState(selectedSiteState);
  const resetTeams = useResetRecoilState(teamsState);

  /**
   * 로그인 처리
   */
  const login = useCallback(
    (accessToken: string, refreshToken: string) => {
      setAuth({
        accessToken,
        refreshToken,
        isLoggedIn: true,
      });
    },
    [setAuth],
  );

  /**
   * 로그아웃 처리
   */
  const logout = useCallback(async () => {
    try {
      // API 클라이언트 인증 정보 초기화
      await apiClient.clearAuth();

      // 모든 Recoil 상태 초기화
      resetUserInfo();
      resetWorkerStatus();
      resetCommuteStatus();
      resetCompany();
      resetSite();
      resetTeams();

      // 인증 상태 초기화
      setAuth({
        accessToken: null,
        refreshToken: null,
        isLoggedIn: false,
      });

      // AsyncStorage 전체 초기화 (선택적)
      // await clearStorage();

      if (__DEV__) {
        console.log('[useAuth] Logged out successfully');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[useAuth] Logout failed:', error);
      }
      // 에러가 발생해도 상태는 초기화
      setAuth({
        accessToken: null,
        refreshToken: null,
        isLoggedIn: false,
      });
    }
  }, [
    setAuth,
    resetUserInfo,
    resetWorkerStatus,
    resetCommuteStatus,
    resetCompany,
    resetSite,
    resetTeams,
  ]);

  /**
   * 토큰 업데이트
   */
  const updateTokens = useCallback(
    (accessToken: string, refreshToken?: string) => {
      setAuth(prev => ({
        ...prev,
        accessToken,
        refreshToken: refreshToken || prev.refreshToken,
      }));
    },
    [setAuth],
  );

  return {
    auth,
    isLoggedIn: auth.isLoggedIn,
    login,
    logout,
    updateTokens,
  };
}

export default useAuth;
