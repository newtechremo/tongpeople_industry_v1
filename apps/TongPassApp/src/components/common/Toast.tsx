/**
 * 토스트 메시지 컴포넌트
 * - 화면 하단에서 나타났다 사라짐
 * - 성공/실패/경고/정보 스타일
 * - 자동 숨김 (duration 설정)
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {colors} from '@/constants/colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  visible: boolean;
  type?: ToastType;
  message: string;
  duration?: number;
  onHide: () => void;
  position?: 'top' | 'bottom';
}

// 타입별 아이콘
const TYPE_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠️',
  info: 'ℹ️',
};

// 타입별 배경색
const TYPE_COLORS: Record<ToastType, string> = {
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  info: colors.info,
};

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const Toast: React.FC<ToastProps> = ({
  visible,
  type = 'info',
  message,
  duration = 3000,
  onHide,
  position = 'bottom',
}) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // 토스트 표시 애니메이션
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 자동 숨김 타이머
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, duration]);

  const hideToast = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'bottom' ? 100 : -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.containerTop : styles.containerBottom,
        {
          transform: [{translateY}],
          opacity,
        },
      ]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={[styles.toast, {backgroundColor: TYPE_COLORS[type]}]}>
        <Text style={styles.icon}>{TYPE_ICONS[type]}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  containerTop: {
    top: 60,
  },
  containerBottom: {
    bottom: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 12,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 20,
  },
});

export default Toast;
