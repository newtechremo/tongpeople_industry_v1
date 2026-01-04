import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분 동안 캐시 유지
      staleTime: 5 * 60 * 1000,
      // 10분 후 캐시 삭제
      gcTime: 10 * 60 * 1000,
      // 윈도우 포커스 시 자동 리페치 비활성화
      refetchOnWindowFocus: false,
      // 재연결 시 자동 리페치
      refetchOnReconnect: true,
      // 재시도 1회
      retry: 1,
    },
    mutations: {
      // 뮤테이션 실패 시 재시도 없음
      retry: false,
    },
  },
});
