/**
 * 공통 버튼 컴포넌트
 * - Primary, Secondary, Outline, Ghost 스타일
 * - 비활성화 상태
 * - 로딩 상태
 * - 아이콘 지원
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {colors} from '@/constants/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  // 버튼 스타일 결정
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button, styles[`button_${size}`]];

    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }

    switch (variant) {
      case 'primary':
        baseStyle.push(styles.buttonPrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        break;
      case 'danger':
        baseStyle.push(styles.buttonDanger);
        break;
    }

    if (isDisabled) {
      baseStyle.push(styles.buttonDisabled);
    }

    return baseStyle;
  };

  // 텍스트 스타일 결정
  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text, styles[`text_${size}`]];

    switch (variant) {
      case 'primary':
      case 'danger':
        baseStyle.push(styles.textPrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.textSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.textOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.textGhost);
        break;
    }

    if (isDisabled) {
      baseStyle.push(styles.textDisabled);
    }

    return baseStyle;
  };

  // 로딩 인디케이터 색상
  const getLoadingColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return colors.primary;
    }
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator size="small" color={getLoadingColor()} />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  // 크기
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 52,
  },
  // 변형
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
    borderColor: colors.buttonDisabled,
  },
  // 텍스트
  text: {
    fontWeight: '600',
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: colors.textPrimary,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.textDisabled,
  },
  // 아이콘
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
});

export default Button;
