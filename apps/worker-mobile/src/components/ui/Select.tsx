import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  containerClassName?: string;
}

export function Select<T extends string = string>({
  label,
  required = false,
  placeholder = '선택해주세요',
  value,
  options,
  onChange,
  disabled = false,
  error = false,
  errorMessage,
  containerClassName = '',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedOption = options.find((opt) => opt.value === value);

  const getBorderStyle = () => {
    if (error) return 'border-2 border-input-border-error';
    if (disabled) return 'border border-input-border-disabled';
    return 'border border-input-border-default';
  };

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
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

      {/* Select Trigger */}
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`
          h-input rounded-input px-4
          flex-row items-center justify-between
          ${getBorderStyle()}
          ${disabled ? 'bg-input-bg-disabled' : 'bg-white'}
        `}
        activeOpacity={0.7}
      >
        <Text
          className={`
            text-base font-pretendard-regular flex-1
            ${selectedOption
              ? disabled
                ? 'text-input-text-disabled'
                : 'text-input-text-default'
              : 'text-input-text-placeholder'
            }
          `}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown
          size={20}
          color={disabled ? colors.input.disabled.text : colors.slate[400]}
        />
      </TouchableOpacity>

      {/* Error Message */}
      {error && errorMessage && (
        <Text className="text-xs text-input-text-error mt-2 font-pretendard-regular">
          {errorMessage}
        </Text>
      )}

      {/* Bottom Sheet Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-modal max-h-[70%]"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-slate-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200">
              <Text className="text-lg font-pretendard-semibold text-slate-800">
                {label || '선택'}
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <X size={24} color={colors.slate[600]} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
              renderItem={({ item }) => {
                const isSelected = value === item.value;
                const isDisabled = item.disabled;

                return (
                  <TouchableOpacity
                    onPress={() => !isDisabled && handleSelect(item.value)}
                    disabled={isDisabled}
                    className={`
                      flex-row items-center justify-between px-4 py-4
                      ${isSelected ? 'bg-brand-50' : ''}
                      ${isDisabled ? 'opacity-50' : ''}
                    `}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`
                        text-base font-pretendard-regular
                        ${isSelected ? 'text-brand-600 font-pretendard-semibold' : 'text-slate-800'}
                      `}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Check size={20} color={colors.primary[600]} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
