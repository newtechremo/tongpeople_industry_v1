/**
 * 메인 하단 탭 네비게이터
 * - 홈 (출퇴근)
 * - 출퇴근 기록
 * - 마이페이지
 */

import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '@/types/navigation';
import {colors} from '@/constants/colors';

import {HomeScreen, AttendanceHistoryScreen} from '@/screens/main';
import MyPageStack from './MyPageStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

// 탭 아이콘 컴포넌트
interface TabIconProps {
  focused: boolean;
  icon: string;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({focused, icon, label}) => {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
};

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="🏠" label="홈" />
          ),
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceHistoryScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="📋" label="출퇴근" />
          ),
        }}
      />
      <Tab.Screen
        name="MyPageTab"
        component={MyPageStack}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="👤" label="마이" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 80,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabIconFocused: {
    transform: [{scale: 1.1}],
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textDisabled,
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default MainTabs;
