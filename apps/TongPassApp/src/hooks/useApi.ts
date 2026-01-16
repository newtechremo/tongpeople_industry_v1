/**
 * API 호출 훅
 * - 로딩 상태 관리
 * - 에러 처리
 * - 재시도 로직
 */

import {useState, useCallback, useRef} from 'react';
import {Alert} from 'react-native';
import {ApiError} from '@/types/api';
import {useAuth} from './useAuth';

interface UseApiOptions {
  // 에러 발생 시 Alert 표시 여부
  showErrorAlert?: boolean;
  // 로딩 중 중복 호출 방지
  preventDuplicate?: boolean;
  // 인증 에러 시 로그아웃 처리
  handleAuthError?: boolean;
}

interface UseApiReturn<T, P extends any[]> {
  execute: (...args: P) => Promise<T | null>;
  loading: boolean;
  error: ApiError | null;
  data: T | null;
  reset: () => void;
}

const defaultOptions: UseApiOptions = {
  showErrorAlert: true,
  preventDuplicate: true,
  handleAuthError: true,
};

/**
 * API 호출을 관리하는 훅
 * @param apiFunction API 호출 함수
 * @param options 옵션
 */
export function useApi<T, P extends any[] = []>(
  apiFunction: (...args: P) => Promise<T>,
  options: UseApiOptions = {},
): UseApiReturn<T, P> {
  const {logout} = useAuth();

  // 옵션 기본값 설정
  const {
    showErrorAlert = defaultOptions.showErrorAlert,
    preventDuplicate = defaultOptions.preventDuplicate,
    handleAuthError = defaultOptions.handleAuthError,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);

  // 중복 호출 방지를 위한 ref
  const isExecutingRef = useRef(false);

  /**
   * API 호출 실행
   */
  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      // 중복 호출 방지
      if (preventDuplicate && isExecutingRef.current) {
        if (__DEV__) {
          console.log('[useApi] Prevented duplicate call');
        }
        return null;
      }

      isExecutingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError('UNKNOWN_ERROR', (err as Error).message);

        setError(apiError);

        // 인증 에러 처리
        if (handleAuthError && apiError.requiresLogout) {
          if (__DEV__) {
            console.log('[useApi] Auth error, logging out');
          }
          await logout();
          return null;
        }

        // 에러 Alert 표시
        if (showErrorAlert) {
          Alert.alert('오류', apiError.userMessage);
        }

        return null;
      } finally {
        setLoading(false);
        isExecutingRef.current = false;
      }
    },
    [apiFunction, logout, preventDuplicate, handleAuthError, showErrorAlert],
  );

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
}

/**
 * 여러 API를 순차적으로 호출하는 훅
 */
export function useSequentialApi<T>(
  apiFunctions: Array<() => Promise<T>>,
  options: UseApiOptions = {},
): UseApiReturn<T[], []> {
  const {logout} = useAuth();

  // 옵션 기본값 설정
  const {
    showErrorAlert = defaultOptions.showErrorAlert,
    handleAuthError = defaultOptions.handleAuthError,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T[] | null>(null);

  const execute = useCallback(async (): Promise<T[] | null> => {
    setLoading(true);
    setError(null);

    const results: T[] = [];

    try {
      for (const apiFunction of apiFunctions) {
        const result = await apiFunction();
        results.push(result);
      }
      setData(results);
      return results;
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError('UNKNOWN_ERROR', (err as Error).message);

      setError(apiError);

      if (handleAuthError && apiError.requiresLogout) {
        await logout();
        return null;
      }

      if (showErrorAlert) {
        Alert.alert('오류', apiError.userMessage);
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunctions, logout, handleAuthError, showErrorAlert]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
}

export default useApi;
