import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardList, ScanLine, User } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export type TabName = 'home' | 'history' | 'scan' | 'mypage';

export interface TabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

interface TabItem {
  name: TabName;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

const tabs: TabItem[] = [
  { name: 'home', label: '홈', icon: Home },
  { name: 'history', label: '출퇴근', icon: ClipboardList },
  { name: 'scan', label: 'QR스캔', icon: ScanLine },
  { name: 'mypage', label: 'MY', icon: User },
];

export function TabBar({ activeTab, onTabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white border-t border-gray-200"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="h-tabbar flex-row">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          const Icon = tab.icon;
          const iconColor = isActive ? colors.tabBar.active : colors.tabBar.inactive;
          const textColor = isActive ? 'text-tab-active' : 'text-tab-inactive';

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => onTabPress(tab.name)}
              className="flex-1 items-center justify-center"
              activeOpacity={0.7}
            >
              <Icon size={24} color={iconColor} />
              <Text
                className={`text-xs mt-1 font-pretendard-medium ${textColor}`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// 플로팅 QR 버튼이 있는 탭바 (선택적)
export interface FloatingTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  onQRPress: () => void;
}

export function FloatingTabBar({
  activeTab,
  onTabPress,
  onQRPress,
}: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  const sideTabsLeft: TabItem[] = [
    { name: 'home', label: '홈', icon: Home },
    { name: 'history', label: '출퇴근', icon: ClipboardList },
  ];

  const sideTabsRight: TabItem[] = [
    { name: 'mypage', label: 'MY', icon: User },
  ];

  const renderTab = (tab: TabItem) => {
    const isActive = activeTab === tab.name;
    const Icon = tab.icon;
    const iconColor = isActive ? colors.tabBar.active : colors.tabBar.inactive;
    const textColor = isActive ? 'text-tab-active' : 'text-tab-inactive';

    return (
      <TouchableOpacity
        key={tab.name}
        onPress={() => onTabPress(tab.name)}
        className="flex-1 items-center justify-center"
        activeOpacity={0.7}
      >
        <Icon size={24} color={iconColor} />
        <Text className={`text-xs mt-1 font-pretendard-medium ${textColor}`}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      className="bg-white border-t border-gray-200"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="h-tabbar flex-row items-center">
        {/* Left Tabs */}
        {sideTabsLeft.map(renderTab)}

        {/* Center QR Button */}
        <View className="flex-1 items-center justify-center">
          <TouchableOpacity
            onPress={onQRPress}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 items-center justify-center shadow-lg -mt-6"
            activeOpacity={0.8}
          >
            <ScanLine size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Right Tabs */}
        {sideTabsRight.map(renderTab)}

        {/* Placeholder for spacing */}
        <View className="flex-1" />
      </View>
    </View>
  );
}
