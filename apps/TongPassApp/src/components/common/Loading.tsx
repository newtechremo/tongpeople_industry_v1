/**
 * 로딩 인디케이터 컴포넌트
 * - 전체 화면 로딩
 * - 인라인 로딩
 * - 오버레이 로딩
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {colors} from '@/constants/colors';

export type LoadingSize = 'small' | 'large';
export type LoadingVariant = 'inline' | 'fullscreen' | 'overlay';

export interface LoadingProps {
  visible?: boolean;
  variant?: LoadingVariant;
  size?: LoadingSize;
  color?: string;
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({
  visible = true,
  variant = 'inline',
  size = 'large',
  color = colors.primary,
  message,
}) => {
  if (!visible) {
    return null;
  }

  // 인라인 로딩
  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  // 전체 화면 로딩
  if (variant === 'fullscreen') {
    return (
      <View style={styles.fullscreenContainer}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  // 오버레이 로딩 (모달)
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent>
      <View style={styles.overlayContainer}>
        <View style={styles.overlayBox}>
          <ActivityIndicator size={size} color={color} />
          {message && (
            <Text style={[styles.message, styles.overlayMessage]}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overlayMessage: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
});

export default Loading;
