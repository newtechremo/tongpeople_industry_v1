/**
 * API 클라이언트
 * - Axios 인스턴스 관리
 * - 토큰 자동 갱신
 * - 에러 처리 통합
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import {BASEURL} from '@env';
import {getStorageData, setStorageData} from '@/utils/storage';
import {ApiError, ApiErrorCode, ApiErrorResponse} from '@/types/api';

// 환경 변수 기본값 (BASEURL이 undefined인 경우 대비)
const API_BASE_URL = BASEURL || 'https://zbqittvnenjgoimlixpn.supabase.co/functions/v1';

// 타임아웃 설정 (ms)
const REQUEST_TIMEOUT = 15000;
const REFRESH_TIMEOUT = 10000;

// 재시도 설정
const MAX_RETRY_COUNT = 2;
const RETRY_DELAY = 1000;

// 인증 상태 타입
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
}

// 확장된 요청 설정
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();

    // API URL 로깅 (디버깅용)
    console.log('[API Client] Base URL:', API_BASE_URL);
    console.log('[API Client] BASEURL env:', BASEURL);
  }

  private setupInterceptors() {
    // 요청 인터셉터: 토큰 추가
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const authState = await getStorageData<AuthState>('authState');
          if (authState?.accessToken) {
            config.headers.Authorization = `Bearer ${authState.accessToken}`;
          }
        } catch (error) {
          // 토큰 조회 실패 시 무시하고 진행
          if (__DEV__) {
            console.warn('[API Client] Failed to get auth state:', error);
          }
        }
        return config;
      },
      error => Promise.reject(this.normalizeError(error)),
    );

    // 응답 인터셉터: 에러 처리 및 토큰 갱신
    this.instance.interceptors.response.use(
      response => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        // 요청 설정이 없는 경우
        if (!originalRequest) {
          return Promise.reject(this.normalizeError(error));
        }

        // 디버깅: 모든 에러 로깅
        console.log('[API Client] Response error:', error.response?.status, error.config?.url, error.message);
        console.log('[API Client] Error data:', JSON.stringify(error.response?.data));

        // 401 에러: 토큰 갱신 시도
        if (error.response?.status === 401 && !originalRequest._retry) {
          return this.handle401Error(error, originalRequest);
        }

        // 네트워크 에러: 재시도
        if (this.isNetworkError(error) && this.canRetry(originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        return Promise.reject(this.normalizeError(error));
      },
    );
  }

  /**
   * 401 에러 처리 (토큰 갱신)
   */
  private async handle401Error(
    error: AxiosError<ApiErrorResponse>,
    originalRequest: ExtendedAxiosRequestConfig,
  ): Promise<any> {
    originalRequest._retry = true;

    if (!this.isRefreshing) {
      this.isRefreshing = true;

      try {
        const authState = await getStorageData<AuthState>('authState');

        if (!authState?.refreshToken) {
          throw new ApiError('INVALID_REFRESH_TOKEN');
        }

        const newTokens = await this.refreshToken(authState.refreshToken);

        // 토큰 저장
        await setStorageData('authState', {
          ...authState,
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken || authState.refreshToken,
        });

        // 대기 중인 요청들 처리
        this.refreshQueue.forEach(({resolve}) =>
          resolve(newTokens.accessToken),
        );
        this.refreshQueue = [];

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return this.instance(originalRequest);
      } catch (refreshError) {
        // 갱신 실패: 모든 대기 요청 실패 처리
        this.refreshQueue.forEach(({reject}) => reject(refreshError as Error));
        this.refreshQueue = [];

        // 로그아웃 처리
        await this.logout();

        return Promise.reject(
          refreshError instanceof ApiError
            ? refreshError
            : new ApiError('REFRESH_TOKEN_EXPIRED'),
        );
      } finally {
        this.isRefreshing = false;
      }
    }

    // 갱신 중이면 큐에 추가하고 대기
    return new Promise((resolve, reject) => {
      this.refreshQueue.push({
        resolve: (token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(this.instance(originalRequest));
        },
        reject,
      });
    });
  }

  /**
   * 토큰 갱신 요청
   */
  private async refreshToken(
    refreshToken: string,
  ): Promise<{accessToken: string; refreshToken?: string}> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth-refresh`,
        {refreshToken},
        {timeout: REFRESH_TIMEOUT},
      );
      return response.data;
    } catch (error) {
      if (__DEV__) {
        console.error('[API Client] Token refresh failed:', error);
      }
      throw new ApiError('REFRESH_TOKEN_EXPIRED');
    }
  }

  /**
   * 로그아웃 처리
   */
  private async logout(): Promise<void> {
    try {
      await setStorageData('authState', {
        accessToken: null,
        refreshToken: null,
        isLoggedIn: false,
      });

      if (__DEV__) {
        console.log('[API Client] Logged out due to token expiration');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[API Client] Failed to clear auth state:', error);
      }
    }
  }

  /**
   * 네트워크 에러 여부 확인
   */
  private isNetworkError(error: AxiosError): boolean {
    return (
      !error.response &&
      (error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error')
    );
  }

  /**
   * 재시도 가능 여부 확인
   */
  private canRetry(config: ExtendedAxiosRequestConfig): boolean {
    const retryCount = config._retryCount || 0;
    return retryCount < MAX_RETRY_COUNT;
  }

  /**
   * 요청 재시도
   */
  private async retryRequest(config: ExtendedAxiosRequestConfig): Promise<any> {
    config._retryCount = (config._retryCount || 0) + 1;

    if (__DEV__) {
      console.log(
        `[API Client] Retrying request (${config._retryCount}/${MAX_RETRY_COUNT}):`,
        config.url,
      );
    }

    // 지연 후 재시도
    await new Promise<void>(resolve => setTimeout(resolve, RETRY_DELAY));
    return this.instance(config);
  }

  /**
   * 에러 정규화
   */
  private normalizeError(
    error: AxiosError<ApiErrorResponse> | Error,
  ): ApiError {
    // 이미 ApiError인 경우
    if (error instanceof ApiError) {
      return error;
    }

    // Axios 에러인 경우
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      // 타임아웃
      if (axiosError.code === 'ECONNABORTED') {
        return new ApiError('TIMEOUT');
      }

      // 네트워크 에러
      if (!axiosError.response) {
        return new ApiError('NETWORK_ERROR');
      }

      // 서버 에러 응답
      const errorData = axiosError.response.data;
      if (errorData?.error?.code) {
        return new ApiError(
          errorData.error.code as ApiErrorCode,
          errorData.error.message,
          axiosError.response.status,
        );
      }

      // HTTP 상태 코드 기반 에러
      const statusCode = axiosError.response.status;
      if (statusCode >= 500) {
        return new ApiError('SERVER_ERROR', undefined, statusCode);
      }
      if (statusCode === 401) {
        return new ApiError('INVALID_TOKEN', undefined, statusCode);
      }
      if (statusCode === 403) {
        return new ApiError('WORKER_NOT_ACTIVE', undefined, statusCode);
      }
    }

    // 기타 에러
    return new ApiError('UNKNOWN_ERROR', error.message);
  }

  /**
   * Axios 인스턴스 반환
   */
  public get axios(): AxiosInstance {
    return this.instance;
  }

  /**
   * 수동 로그아웃 (외부에서 호출)
   */
  public async clearAuth(): Promise<void> {
    await this.logout();
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();
export default apiClient.axios;
