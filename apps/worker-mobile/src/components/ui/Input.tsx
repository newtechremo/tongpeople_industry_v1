import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';

export type InputState = 'default' | 'focused' | 'filled' | 'disabled' | 'error' | 'success';

export interface InputProps extends Omit<TextInputProps, 'editable'> {
  label?: string;
  required?: boolean;
  state?: InputState;
  errorMessage?: string;
  successMessage?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

// 상태별 스타일 정의 (레퍼런스 기반)
const getInputStyles = (state: InputState, isFocused: boolean) => {
  const actualState = isFocused ? 'focused' : state;

  switch (actualState) {
    case 'focused':
      return {
        container: 'border-2 border-input-border-focused',
        text: 'text-input-text-default',
        ring: true,
      };
    case 'disabled':
      return {
        container: 'border border-input-border-disabled bg-input-bg-disabled',
        text: 'text-input-text-disabled',
        ring: false,
      };
    case 'error':
      return {
        container: 'border-2 border-input-border-error',
        text: 'text-input-text-default',
        ring: false,
      };
    case 'success':
      return {
        container: 'border border-input-border-success',
        text: 'text-input-text-default',
        ring: false,
      };
    case 'filled':
    case 'default':
    default:
      return {
        container: 'border border-input-border-default',
        text: 'text-input-text-default',
        ring: false,
      };
  }
};

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      required = false,
      state = 'default',
      errorMessage,
      successMessage,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerClassName = '',
      value,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // 값이 있으면 filled 상태로 처리
    const actualState = state === 'default' && value ? 'filled' : state;
    const styles = getInputStyles(actualState, isFocused);
    const isDisabled = state === 'disabled';

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <View className={`mb-4 ${containerClassName}`}>
        {/* Label */}
        {label && (
          <Text className="text-sm font-pretendard-medium text-slate-600 mb-2">
            {label}
            {required && <Text className="text-red-500"> *</Text>}
          </Text>
        )}

        {/* Input Container */}
        <View
          className={`
            h-input rounded-input bg-white
            flex-row items-center px-4
            ${styles.container}
            ${styles.ring ? 'ring-2 ring-input-ring' : ''}
          `}
        >
          {/* Left Icon */}
          {leftIcon && <View className="mr-3">{leftIcon}</View>}

          {/* TextInput */}
          <TextInput
            ref={ref}
            value={value}
            editable={!isDisabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={colors.input.default.placeholder}
            className={`
              flex-1 text-base font-pretendard-regular
              ${styles.text}
            `}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              className="ml-3"
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>

        {/* Error Message */}
        {state === 'error' && errorMessage && (
          <Text className="text-xs text-input-text-error mt-2 font-pretendard-regular">
            {errorMessage}
          </Text>
        )}

        {/* Success Message */}
        {state === 'success' && successMessage && (
          <Text className="text-xs text-green-600 mt-2 font-pretendard-regular">
            {successMessage}
          </Text>
        )}

        {/* Helper Text */}
        {helperText && state !== 'error' && state !== 'success' && (
          <Text className="text-xs text-slate-500 mt-2 font-pretendard-regular">
            {helperText}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
