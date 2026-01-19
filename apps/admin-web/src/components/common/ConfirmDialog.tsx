import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export type DialogVariant = 'info' | 'success' | 'warning' | 'danger';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  /** true면 확인 버튼만 표시 (alert 스타일) */
  alertOnly?: boolean;
}

const variantConfig: Record<DialogVariant, {
  icon: typeof AlertTriangle;
  iconColor: string;
  iconBg: string;
  confirmBg: string;
  confirmHover: string;
}> = {
  info: {
    icon: Info,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    confirmBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    confirmHover: 'hover:from-orange-600 hover:to-orange-700',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    confirmBg: 'bg-gradient-to-r from-green-500 to-green-600',
    confirmHover: 'hover:from-green-600 hover:to-green-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    confirmBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    confirmHover: 'hover:from-orange-600 hover:to-orange-700',
  },
  danger: {
    icon: XCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    confirmBg: 'bg-red-500',
    confirmHover: 'hover:bg-red-600',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'warning',
  alertOnly = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const dialogContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-dialog-in"
        role="alertdialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        aria-modal="true"
      >
        <div className="p-6">
          {/* Icon & Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
              <Icon size={20} className={config.iconColor} />
            </div>
            <h3 id="dialog-title" className="text-lg font-black text-slate-800">
              {title}
            </h3>
          </div>

          {/* Message */}
          <p id="dialog-description" className="text-sm text-slate-600 mb-6 whitespace-pre-line">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            {!alertOnly && (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`flex-1 py-2.5 rounded-xl font-bold text-white transition-all ${config.confirmBg} ${config.confirmHover}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}

export default ConfirmDialog;
