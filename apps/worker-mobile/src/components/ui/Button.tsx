import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-gradient-to-r from-brand-500 to-brand-600',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-white border border-gray-300',
    text: 'text-slate-600',
  },
  danger: {
    container: 'bg-red-600',
    text: 'text-white',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-brand-600',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'h-button-sm px-4',
    text: 'text-sm',
  },
  md: {
    container: 'h-button-md px-5',
    text: 'text-base',
  },
  lg: {
    container: 'h-button-lg px-6',
    text: 'text-base',
  },
};

const disabledStyles = {
  container: 'bg-gray-200',
  text: 'text-gray-400',
};

export function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle = isDisabled
    ? disabledStyles.container
    : variantStyles[variant].container;

  const textStyle = isDisabled
    ? disabledStyles.text
    : variantStyles[variant].text;

  return (
    <TouchableOpacity
      className={`
        ${sizeStyles[size].container}
        ${containerStyle}
        ${fullWidth ? 'w-full' : ''}
        rounded-button
        flex-row items-center justify-center
        ${className}
      `}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#F97316'}
          size="small"
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text
            className={`
              ${sizeStyles[size].text}
              ${textStyle}
              font-pretendard-bold
            `}
          >
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

// Gradient 지원을 위한 별도 컴포넌트 (expo-linear-gradient 필요시)
export function GradientButton(props: ButtonProps) {
  // NativeWind는 bg-gradient-to-r을 네이티브에서 지원하지 않으므로
  // 실제 그라데이션이 필요하면 expo-linear-gradient 사용
  return <Button {...props} />;
}
