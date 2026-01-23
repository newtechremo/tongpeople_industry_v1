/**
 * Toast Context
 * - 앱 전역에서 토스트 메시지 사용
 * - useToast 훅으로 간편하게 호출
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {Toast, ToastType} from '@/components/common';

interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number,
  ) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({children}) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'info',
    message: '',
    duration: 3000,
  });

  /**
   * 토스트 표시
   */
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      setToast({
        visible: true,
        type,
        message,
        duration,
      });
    },
    [],
  );

  /**
   * 성공 토스트
   */
  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast],
  );

  /**
   * 에러 토스트
   */
  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast],
  );

  /**
   * 경고 토스트
   */
  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },
    [showToast],
  );

  /**
   * 정보 토스트
   */
  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast],
  );

  /**
   * 토스트 숨기기
   */
  const hideToast = useCallback(() => {
    setToast(prev => ({...prev, visible: false}));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
      }}>
      {children}
      <Toast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        duration={toast.duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

/**
 * Toast 훅
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
