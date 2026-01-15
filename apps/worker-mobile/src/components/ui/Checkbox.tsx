import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: { box: 'w-5 h-5', icon: 14, text: 'text-sm' },
  md: { box: 'w-6 h-6', icon: 16, text: 'text-base' },
  lg: { box: 'w-7 h-7', icon: 18, text: 'text-base' },
};

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: CheckboxProps) {
  const styles = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex-row items-center ${className}`}
      activeOpacity={0.7}
    >
      <View
        className={`
          ${styles.box}
          rounded-md
          items-center justify-center
          ${checked
            ? 'bg-brand-500'
            : 'bg-white border-2 border-slate-300'
          }
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {checked && (
          <Check
            size={styles.icon}
            color={colors.white}
            strokeWidth={3}
          />
        )}
      </View>

      {label && (
        <Text
          className={`
            ml-3 font-pretendard-regular
            ${styles.text}
            ${disabled ? 'text-slate-400' : 'text-slate-800'}
          `}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// 전체 동의 체크박스
export interface CheckAllProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function CheckAll({
  checked,
  onChange,
  label = '전체 동의',
  disabled = false,
}: CheckAllProps) {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="flex-row items-center py-4 px-4 bg-slate-50 rounded-xl"
      activeOpacity={0.7}
    >
      <View
        className={`
          w-6 h-6 rounded-md items-center justify-center
          ${checked ? 'bg-brand-500' : 'bg-white border-2 border-slate-300'}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {checked && (
          <Check size={16} color={colors.white} strokeWidth={3} />
        )}
      </View>
      <Text
        className={`
          ml-3 text-base font-pretendard-bold
          ${disabled ? 'text-slate-400' : 'text-slate-800'}
        `}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
