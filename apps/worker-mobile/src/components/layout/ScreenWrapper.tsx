import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  padding?: boolean;
  safeAreaBottom?: boolean;
  backgroundColor?: string;
  contentContainerStyle?: object;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  keyboardAvoiding = false,
  padding = true,
  safeAreaBottom = true,
  backgroundColor = '#F9FAFB', // gray-50
  contentContainerStyle,
  className = '',
  ...props
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View
      className={`flex-1 ${padding ? 'px-4' : ''} ${className}`}
      style={{ backgroundColor }}
      {...props}
    >
      {children}
      {safeAreaBottom && <View style={{ height: insets.bottom }} />}
    </View>
  );

  // 키보드 회피 래퍼
  const withKeyboardAvoiding = (child: React.ReactNode) => {
    if (!keyboardAvoiding) return child;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {child}
      </KeyboardAvoidingView>
    );
  };

  // 스크롤 래퍼
  if (scrollable) {
    return withKeyboardAvoiding(
      <ScrollView
        className="flex-1"
        style={{ backgroundColor }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: padding ? 16 : 0,
          paddingBottom: safeAreaBottom ? insets.bottom : 0,
          ...contentContainerStyle,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return withKeyboardAvoiding(content);
}

// 풀스크린 래퍼 (SafeArea 무시)
export interface FullScreenWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export function FullScreenWrapper({
  children,
  backgroundColor = '#FFFFFF',
}: FullScreenWrapperProps) {
  return (
    <View className="flex-1" style={{ backgroundColor }}>
      {children}
    </View>
  );
}

// 하단 고정 버튼 영역
export interface BottomActionProps {
  children: React.ReactNode;
  padding?: boolean;
  backgroundColor?: string;
  withShadow?: boolean;
}

export function BottomAction({
  children,
  padding = true,
  backgroundColor = '#FFFFFF',
  withShadow = true,
}: BottomActionProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`
        ${padding ? 'px-4 py-4' : ''}
        ${withShadow ? 'shadow-lg' : ''}
      `}
      style={{
        backgroundColor,
        paddingBottom: Math.max(insets.bottom, padding ? 16 : 0),
      }}
    >
      {children}
    </View>
  );
}
