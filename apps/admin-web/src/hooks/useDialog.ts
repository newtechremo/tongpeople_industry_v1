import { useState, useCallback } from 'react';
import type { DialogVariant } from '@/components/common/ConfirmDialog';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText: string;
  cancelText: string;
  variant: DialogVariant;
  alertOnly: boolean;
  onConfirm: () => void;
}

const initialState: DialogState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: '확인',
  cancelText: '취소',
  variant: 'warning',
  alertOnly: false,
  onConfirm: () => {},
};

interface ShowDialogOptions {
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  onConfirm?: () => void;
}

interface ShowAlertOptions {
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  variant?: DialogVariant;
  onConfirm?: () => void;
}

export function useDialog() {
  const [dialogState, setDialogState] = useState<DialogState>(initialState);

  // confirm 스타일 (확인/취소 버튼)
  const showConfirm = useCallback((options: ShowDialogOptions) => {
    setDialogState({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || '확인',
      cancelText: options.cancelText || '취소',
      variant: options.variant || 'warning',
      alertOnly: false,
      onConfirm: options.onConfirm || (() => {}),
    });
  }, []);

  // alert 스타일 (확인 버튼만)
  const showAlert = useCallback((options: ShowAlertOptions) => {
    setDialogState({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || '확인',
      cancelText: '취소',
      variant: options.variant || 'info',
      alertOnly: true,
      onConfirm: options.onConfirm || (() => {}),
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    dialogState,
    showConfirm,
    showAlert,
    closeDialog,
  };
}
