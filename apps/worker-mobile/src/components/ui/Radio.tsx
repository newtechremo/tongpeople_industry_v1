import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { colors } from '../../theme/colors';

export interface RadioProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: { outer: 'w-5 h-5', inner: 'w-2.5 h-2.5' },
  md: { outer: 'w-6 h-6', inner: 'w-3 h-3' },
  lg: { outer: 'w-7 h-7', inner: 'w-3.5 h-3.5' },
};

export function Radio({
  selected,
  onSelect,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}: RadioProps) {
  const styles = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={() => !disabled && onSelect()}
      disabled={disabled}
      className={`flex-row items-start ${className}`}
      activeOpacity={0.7}
    >
      <View
        className={`
          ${styles.outer}
          rounded-full
          items-center justify-center
          border-2
          ${selected ? 'border-brand-500' : 'border-slate-300'}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {selected && (
          <View
            className={`
              ${styles.inner}
              rounded-full
              bg-brand-500
            `}
          />
        )}
      </View>

      {(label || description) && (
        <View className="ml-3 flex-1">
          {label && (
            <Text
              className={`
                text-base font-pretendard-regular
                ${disabled ? 'text-slate-400' : 'text-slate-800'}
              `}
            >
              {label}
            </Text>
          )}
          {description && (
            <Text className="text-sm text-slate-500 mt-1 font-pretendard-regular">
              {description}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// 라디오 그룹
export interface RadioGroupProps<T extends string> {
  value: T | null;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  className?: string;
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  direction = 'vertical',
  className = '',
}: RadioGroupProps<T>) {
  return (
    <View
      className={`
        ${direction === 'horizontal' ? 'flex-row flex-wrap' : ''}
        ${className}
      `}
    >
      {options.map((option, index) => (
        <View
          key={option.value}
          className={`
            ${direction === 'horizontal' ? 'mr-6' : ''}
            ${index > 0 && direction === 'vertical' ? 'mt-4' : ''}
          `}
        >
          <Radio
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
          />
        </View>
      ))}
    </View>
  );
}
