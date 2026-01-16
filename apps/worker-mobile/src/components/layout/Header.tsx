import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export type HeaderVariant = 'solid' | 'gradient' | 'transparent' | 'white';

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  variant?: HeaderVariant;
  centerTitle?: boolean;
}

const variantStyles: Record<HeaderVariant, { bg: string; text: string; icon: string }> = {
  solid: {
    bg: 'bg-header',
    text: 'text-header-text',
    icon: colors.header.icon,
  },
  gradient: {
    bg: 'bg-gradient-to-r from-brand-500 to-brand-600',
    text: 'text-white',
    icon: '#FFFFFF',
  },
  transparent: {
    bg: 'bg-transparent',
    text: 'text-white',
    icon: '#FFFFFF',
  },
  white: {
    bg: 'bg-white border-b border-gray-200',
    text: 'text-slate-800',
    icon: colors.slate[800],
  },
};

export function Header({
  title,
  showBack = false,
  onBack,
  leftAction,
  rightAction,
  variant = 'solid',
  centerTitle = true,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const styles = variantStyles[variant];

  // 상태바 스타일 결정
  const statusBarStyle = variant === 'white' ? 'dark-content' : 'light-content';

  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={variant === 'transparent' ? 'transparent' : colors.header.background}
        translucent={variant === 'transparent'}
      />

      <View
        className={`${styles.bg}`}
        style={{ paddingTop: variant === 'transparent' ? insets.top : 0 }}
      >
        {/* 투명이 아닌 경우 SafeArea 패딩 */}
        {variant !== 'transparent' && (
          <View style={{ height: insets.top }} className={styles.bg} />
        )}

        {/* Header Content */}
        <View className="h-header flex-row items-center px-4">
          {/* Left Area */}
          <View className="w-12 items-start">
            {leftAction ? (
              leftAction
            ) : showBack ? (
              <TouchableOpacity
                onPress={onBack}
                className="p-2 -ml-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={24} color={styles.icon} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Title */}
          <View className={`flex-1 ${centerTitle ? 'items-center' : 'items-start'}`}>
            {title && (
              <Text
                className={`text-lg font-pretendard-semibold ${styles.text}`}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
          </View>

          {/* Right Area */}
          <View className="w-12 items-end">
            {rightAction}
          </View>
        </View>
      </View>
    </>
  );
}

// 로고 헤더 (홈 화면용)
export interface LogoHeaderProps {
  logo?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function LogoHeader({ logo, rightAction }: LogoHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.header.background} />

      <View className="bg-header">
        <View style={{ height: insets.top }} className="bg-header" />

        <View className="h-header flex-row items-center justify-between px-4">
          {/* Logo Area */}
          <View className="flex-row items-center">
            {logo || (
              <Text className="text-xl font-pretendard-bold text-white">
                산업현장통
              </Text>
            )}
          </View>

          {/* Right Action */}
          {rightAction && <View>{rightAction}</View>}
        </View>
      </View>
    </>
  );
}
