/**
 * 알림 모달 컴포넌트
 * - 단일 확인 버튼
 * - 아이콘 지원
 * - 성공/실패/경고 스타일
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {colors} from '@/constants/colors';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  icon?: string;
  buttonText?: string;
  onClose: () => void;
  closeOnBackdrop?: boolean;
}

// 타입별 기본 아이콘
const DEFAULT_ICONS: Record<AlertType, string> = {
  success: '✓',
  error: '!',
  warning: '⚠️',
  info: 'ℹ️',
};

// 타입별 색상
const TYPE_COLORS: Record<AlertType, string> = {
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  info: colors.info,
};

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  type = 'info',
  title,
  message,
  icon,
  buttonText = '확인',
  onClose,
  closeOnBackdrop = true,
}) => {
  const typeColor = TYPE_COLORS[type];
  const defaultIcon = DEFAULT_ICONS[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={closeOnBackdrop ? onClose : undefined}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* 아이콘 */}
              <View
                style={[
                  styles.iconContainer,
                  {backgroundColor: `${typeColor}20`},
                ]}>
                <Text
                  style={[
                    styles.icon,
                    type === 'success' || type === 'error'
                      ? {color: typeColor, fontWeight: 'bold'}
                      : null,
                  ]}>
                  {icon || defaultIcon}
                </Text>
              </View>

              {/* 제목 */}
              <Text style={styles.title}>{title}</Text>

              {/* 메시지 */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* 확인 버튼 */}
              <TouchableOpacity
                style={[styles.button, {backgroundColor: typeColor}]}
                onPress={onClose}
                activeOpacity={0.7}>
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AlertModal;
