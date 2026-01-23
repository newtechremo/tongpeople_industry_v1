/**
 * 마이페이지 스택 네비게이터
 * - MyPage (메인)
 * - ProfileDetail (내 정보)
 * - Settings (설정) - 추후 추가
 * - PersonalQR (개인 QR) - 추후 추가
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {MyPageStackParamList} from '@/types/navigation';
import {colors} from '@/constants/colors';

import {
  MyPageScreen,
  ProfileDetailScreen,
  SettingsScreen,
  PersonalQRScreen,
  CompanyListScreen,
} from '@/screens/mypage';

const Stack = createNativeStackNavigator<MyPageStackParamList>();

const MyPageStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: colors.textPrimary,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
      }}>
      <Stack.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ProfileDetail"
        component={ProfileDetailScreen}
        options={{title: '내 정보'}}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: '설정'}}
      />
      <Stack.Screen
        name="PersonalQR"
        component={PersonalQRScreen}
        options={{title: '개인 QR 코드'}}
      />
      <Stack.Screen
        name="CompanyList"
        component={CompanyListScreen}
        options={{title: '참여 회사'}}
      />
    </Stack.Navigator>
  );
};

export default MyPageStack;
