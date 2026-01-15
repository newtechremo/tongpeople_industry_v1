/**
 * 사용자 상태 변경 실시간 모니터링 훅
 *
 * Supabase Realtime을 사용하여 사용자 상태 변경을 감지합니다.
 * 관리자가 승인/차단 시 실시간으로 반영됩니다.
 */
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { WorkerStatus } from '@tong-pass/shared';

interface UseStatusMonitorOptions {
  /** 상태 변경 시 호출되는 콜백 */
  onStatusChange?: (newStatus: WorkerStatus, oldStatus: WorkerStatus) => void;
  /** 차단 시 자동 로그아웃 여부 (기본: true) */
  autoSignOutOnBlocked?: boolean;
}

/**
 * 사용자 상태 변경 모니터링
 *
 * @param userId 모니터링할 사용자 ID
 * @param options 옵션
 */
export function useStatusMonitor(
  userId: string | undefined,
  options: UseStatusMonitorOptions = {}
) {
  const { onStatusChange, autoSignOutOnBlocked = true } = options;
  const previousStatusRef = useRef<WorkerStatus | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as WorkerStatus;
          const oldStatus = previousStatusRef.current || (payload.old.status as WorkerStatus);

          console.log('[StatusMonitor] 상태 변경 감지:', oldStatus, '->', newStatus);

          // 콜백 호출
          if (onStatusChange && newStatus !== oldStatus) {
            onStatusChange(newStatus, oldStatus);
          }

          // 상태별 처리
          switch (newStatus) {
            case 'BLOCKED':
              handleBlocked();
              break;

            case 'ACTIVE':
              handleActivated(oldStatus);
              break;

            case 'INACTIVE':
              handleInactive();
              break;
          }

          previousStatusRef.current = newStatus;
        }
      )
      .subscribe((status) => {
        console.log('[StatusMonitor] 구독 상태:', status);
      });

    return () => {
      console.log('[StatusMonitor] 구독 해제');
      supabase.removeChannel(channel);
    };
  }, [userId, onStatusChange, autoSignOutOnBlocked]);

  /**
   * 차단됨 처리
   */
  async function handleBlocked() {
    Alert.alert(
      '접근 차단',
      '관리자에 의해 접근이 차단되었습니다.\n자세한 내용은 관리자에게 문의해주세요.',
      [
        {
          text: '확인',
          onPress: async () => {
            if (autoSignOutOnBlocked) {
              await supabase.auth.signOut();
            }
            router.replace('/blocked');
          },
        },
      ],
      { cancelable: false }
    );
  }

  /**
   * 활성화됨 처리 (승인됨)
   */
  function handleActivated(oldStatus: WorkerStatus | null) {
    // 승인 대기 상태에서 활성화된 경우
    if (oldStatus === 'PENDING' || oldStatus === 'REQUESTED') {
      Alert.alert(
        '가입 승인 완료',
        '관리자가 가입을 승인했습니다.\n이제 서비스를 이용할 수 있습니다.',
        [
          {
            text: '시작하기',
            onPress: () => {
              router.replace('/');
            },
          },
        ]
      );
    }
  }

  /**
   * 비활성화됨 처리
   */
  function handleInactive() {
    Alert.alert(
      '계정 비활성화',
      '계정이 비활성화되었습니다.\n관리자에게 문의해주세요.',
      [
        {
          text: '확인',
          onPress: () => {
            router.replace('/blocked');
          },
        },
      ],
      { cancelable: false }
    );
  }
}

/**
 * 출퇴근 기록 실시간 모니터링 훅
 *
 * 본인의 출퇴근 기록 변경을 실시간으로 감지합니다.
 */
export function useAttendanceMonitor(
  userId: string | undefined,
  onUpdate?: (record: any) => void
) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`attendance-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[AttendanceMonitor] 출퇴근 변경:', payload.eventType);

          if (onUpdate) {
            onUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);
}
