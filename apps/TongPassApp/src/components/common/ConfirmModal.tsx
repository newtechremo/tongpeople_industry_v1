/**
 * 확인/취소 모달 컴포넌트
 * - 두 개의 버튼 (취소/확인)
 * - 커스텀 버튼 텍스트 지원
 * - 아이콘 지원
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

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  closeOnBackdrop?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  icon,
  confirmText = '확인',
  cancelText = '취소',
  confirmColor = colors.primary,
  onConfirm,
  onCancel,
  closeOnBackdrop = true,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <TouchableWithoutFeedback
        onPress={closeOnBackdrop ? onCancel : undefined}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* 아이콘 */}
              {icon && (
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>{icon}</Text>
                </View>
              )}

              {/* 제목 */}
              <Text style={styles.title}>{title}</Text>

              {/* 메시지 */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* 버튼 영역 */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  activeOpacity={0.7}>
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    {backgroundColor: confirmColor},
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.7}>
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: colors.primaryLight,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ConfirmModal;
