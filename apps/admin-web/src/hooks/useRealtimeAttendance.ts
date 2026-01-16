/**
 * 출퇴근 기록 실시간 갱신 훅
 *
 * Supabase Realtime을 사용하여 출퇴근 기록 변경을 감지하고
 * React Query 캐시를 자동으로 무효화합니다.
 */
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface UseRealtimeAttendanceOptions {
  /** 출퇴근 변경 시 호출되는 콜백 */
  onAttendanceChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', record: any) => void;
  /** 디버그 로깅 활성화 */
  debug?: boolean;
}

/**
 * 출퇴근 기록 실시간 갱신
 *
 * 현장의 출퇴근 기록이 변경되면 자동으로 React Query 캐시를 갱신합니다.
 *
 * @param siteId 현장 ID
 * @param options 옵션
 */
export function useRealtimeAttendance(
  siteId: number | undefined,
  options: UseRealtimeAttendanceOptions = {}
) {
  const { onAttendanceChange, debug = false } = options;
  const queryClient = useQueryClient();

  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log('[RealtimeAttendance]', ...args);
      }
    },
    [debug]
  );

  useEffect(() => {
    if (!siteId) return;

    log('구독 시작 - siteId:', siteId);

    const channel = supabase
      .channel(`attendance-site-${siteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          log('출퇴근 변경 감지:', payload.eventType, payload.new);

          // 콜백 호출
          if (onAttendanceChange) {
            onAttendanceChange(
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              payload.new
            );
          }

          // React Query 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });

          log('캐시 무효화 완료');
        }
      )
      .subscribe((status) => {
        log('구독 상태:', status);
      });

    return () => {
      log('구독 해제 - siteId:', siteId);
      supabase.removeChannel(channel);
    };
  }, [siteId, queryClient, onAttendanceChange, log]);
}

/**
 * 근로자 상태 실시간 갱신
 *
 * 근로자의 상태(승인/차단 등)가 변경되면 자동으로 React Query 캐시를 갱신합니다.
 *
 * @param siteId 현장 ID (선택)
 * @param options 옵션
 */
export function useRealtimeWorkers(
  siteId?: number,
  options: { onWorkerChange?: (event: string, worker: any) => void; debug?: boolean } = {}
) {
  const { onWorkerChange, debug = false } = options;
  const queryClient = useQueryClient();

  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log('[RealtimeWorkers]', ...args);
      }
    },
    [debug]
  );

  useEffect(() => {
    const filter = siteId ? `site_id=eq.${siteId}` : undefined;

    log('구독 시작', siteId ? `- siteId: ${siteId}` : '- 전체');

    const channel = supabase
      .channel(siteId ? `workers-site-${siteId}` : 'workers-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          ...(filter && { filter }),
        },
        (payload) => {
          log('근로자 변경 감지:', payload.eventType, payload.new);

          // 콜백 호출
          if (onWorkerChange) {
            onWorkerChange(payload.eventType, payload.new);
          }

          // React Query 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ['workers'] });
          queryClient.invalidateQueries({ queryKey: ['pending-workers'] });

          log('캐시 무효화 완료');
        }
      )
      .subscribe((status) => {
        log('구독 상태:', status);
      });

    return () => {
      log('구독 해제');
      supabase.removeChannel(channel);
    };
  }, [siteId, queryClient, onWorkerChange, log]);
}

/**
 * 대시보드 종합 실시간 갱신
 *
 * 출퇴근과 근로자 변경을 모두 감지합니다.
 *
 * @param siteId 현장 ID
 */
export function useRealtimeDashboard(siteId: number | undefined) {
  // 출퇴근 변경 감지
  useRealtimeAttendance(siteId);

  // 근로자 변경 감지
  useRealtimeWorkers(siteId);
}
