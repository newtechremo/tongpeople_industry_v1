/**
 * 타이머 훅
 * - SMS 인증 타이머
 * - 카운트다운 기능
 */

import {useState, useEffect, useCallback, useRef} from 'react';

interface UseTimerOptions {
  // 초기 시간 (초)
  initialTime: number;
  // 자동 시작 여부
  autoStart?: boolean;
  // 완료 콜백
  onComplete?: () => void;
  // 틱 콜백 (매초 호출)
  onTick?: (remaining: number) => void;
}

interface UseTimerReturn {
  // 남은 시간 (초)
  remaining: number;
  // 포맷된 시간 (MM:SS)
  formatted: string;
  // 실행 중 여부
  isRunning: boolean;
  // 완료 여부
  isComplete: boolean;
  // 시작
  start: () => void;
  // 일시정지
  pause: () => void;
  // 재시작 (초기화 후 시작)
  restart: () => void;
  // 초기화
  reset: () => void;
}

/**
 * 카운트다운 타이머 훅
 */
export function useTimer(options: UseTimerOptions): UseTimerReturn {
  const {initialTime, autoStart = false, onComplete, onTick} = options;

  const [remaining, setRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  // 콜백 업데이트
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onComplete, onTick]);

  // 타이머 로직
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;

        // 틱 콜백
        if (onTickRef.current) {
          onTickRef.current(next);
        }

        // 완료 처리
        if (next <= 0) {
          setIsRunning(false);
          setIsComplete(true);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  /**
   * 시간을 MM:SS 형식으로 포맷
   */
  const formatted = useCallback(() => {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [remaining])();

  /**
   * 타이머 시작
   */
  const start = useCallback(() => {
    if (remaining > 0) {
      setIsRunning(true);
      setIsComplete(false);
    }
  }, [remaining]);

  /**
   * 타이머 일시정지
   */
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  /**
   * 타이머 재시작
   */
  const restart = useCallback(() => {
    setRemaining(initialTime);
    setIsComplete(false);
    setIsRunning(true);
  }, [initialTime]);

  /**
   * 타이머 초기화
   */
  const reset = useCallback(() => {
    setRemaining(initialTime);
    setIsRunning(false);
    setIsComplete(false);
  }, [initialTime]);

  return {
    remaining,
    formatted,
    isRunning,
    isComplete,
    start,
    pause,
    restart,
    reset,
  };
}

/**
 * SMS 인증 전용 타이머 (3분)
 */
export function useSmsTimer(onExpire?: () => void) {
  return useTimer({
    initialTime: 180, // 3분
    autoStart: false,
    onComplete: onExpire,
  });
}

export default useTimer;
