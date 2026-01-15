import React from 'react';
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-white border border-gray-200 shadow-sm',
  elevated: 'bg-white shadow-md',
  outlined: 'bg-white border border-gray-300',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({
  variant = 'default',
  padding = 'lg',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <View
      className={`
        rounded-card
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
}

// 터치 가능한 카드
export interface PressableCardProps extends TouchableOpacityProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function PressableCard({
  variant = 'default',
  padding = 'lg',
  className = '',
  children,
  ...props
}: PressableCardProps) {
  return (
    <TouchableOpacity
      className={`
        rounded-card
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}
