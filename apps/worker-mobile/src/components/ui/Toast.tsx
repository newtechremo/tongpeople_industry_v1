import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X, AlertTriangle, Info } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  visible: boolean;
  type?: ToastType;
  message: string;
  duration?: number;
  onHide: () => void;
}

const iconMap: Record<ToastType, React.ComponentType<{ size: number; color: string }>> = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap: Record<ToastType, string> = {
  success: colors.semantic.success,
  error: colors.semantic.error,
  warning: colors.semantic.warning,
  info: colors.semantic.info,
};

export function Toast({
  visible,
  type = 'success',
  message,
  duration = 2000,
  onHide,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const Icon = iconMap[type];
  const iconColor = iconColorMap[type];

  return (
    <Animated.View
      className="absolute left-4 right-4 bottom-24 items-center"
      style={{
        opacity,
        transform: [{ translateY }],
        marginBottom: insets.bottom,
      }}
      pointerEvents="none"
    >
      <View
        className="flex-row items-center px-5 py-4 rounded-xl bg-slate-800/95 shadow-lg"
        style={{ maxWidth: Dimensions.get('window').width - 32 }}
      >
        <View
          className="w-6 h-6 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: iconColor + '20' }}
        >
          <Icon size={16} color={iconColor} />
        </View>
        <Text className="text-white text-base font-pretendard-medium flex-1">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

// Toast Hook
import { useState, useCallback } from 'react';

export interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'success',
    message: '',
  });

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ visible: true, type, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
    // Convenience methods
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    warning: (message: string) => showToast(message, 'warning'),
    info: (message: string) => showToast(message, 'info'),
  };
}
