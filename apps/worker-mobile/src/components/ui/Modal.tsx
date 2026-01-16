import React from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  Pressable,
  TouchableOpacity,
  ModalProps as RNModalProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { Button } from './Button';

// 기본 모달
export interface ModalProps extends Omit<RNModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}

export function Modal({
  visible,
  onClose,
  title,
  showCloseButton = true,
  children,
  ...props
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center p-4"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-modal w-full max-w-sm"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              {title && (
                <Text className="text-lg font-pretendard-semibold text-slate-800">
                  {title}
                </Text>
              )}
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} className="p-1">
                  <X size={24} color={colors.slate[600]} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <View className="p-4">{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

// 확인/취소 팝업
export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  type?: AlertType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const alertIcons: Record<AlertType, React.ComponentType<{ size: number; color: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const alertColors: Record<AlertType, string> = {
  info: colors.semantic.info,
  success: colors.semantic.success,
  warning: colors.semantic.warning,
  error: colors.semantic.error,
};

export function AlertModal({
  visible,
  onClose,
  type = 'info',
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  showCancel = false,
}: AlertModalProps) {
  const Icon = alertIcons[type];
  const iconColor = alertColors[type];

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center p-4"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-modal w-full max-w-sm p-6"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View className="items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: iconColor + '15' }}
            >
              <Icon size={32} color={iconColor} />
            </View>
          </View>

          {/* Title */}
          <Text className="text-lg font-pretendard-bold text-slate-800 text-center mb-2">
            {title}
          </Text>

          {/* Message */}
          {message && (
            <Text className="text-base font-pretendard-regular text-slate-600 text-center mb-6">
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View className={`flex-row ${showCancel ? 'gap-3' : ''}`}>
            {showCancel && (
              <View className="flex-1">
                <Button variant="secondary" onPress={handleCancel}>
                  {cancelText}
                </Button>
              </View>
            )}
            <View className={showCancel ? 'flex-1' : 'w-full'}>
              <Button variant="primary" onPress={handleConfirm}>
                {confirmText}
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

// 뒤로가기 경고 팝업 (계획서 기반)
export interface BackExitWarningProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function BackExitWarning({
  visible,
  onClose,
  onConfirm,
  title = '정보 입력을 중단하시겠습니까?',
  message = '입력한 정보가 저장되지 않습니다.',
}: BackExitWarningProps) {
  return (
    <AlertModal
      visible={visible}
      onClose={onClose}
      type="warning"
      title={title}
      message={message}
      confirmText="나가기"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onClose}
      showCancel
    />
  );
}
