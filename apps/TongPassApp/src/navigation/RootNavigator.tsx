/**
 * 루트 네비게이터
 * - 로그인 상태와 근로자 상태에 따라 화면 분기
 * - AuthStack: 비로그인 상태
 * - WaitingScreen: 가입 요청 후 승인 대기
 * - MainStack: 승인 완료 (ACTIVE) 상태
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useRecoilValue} from 'recoil';
import {authState} from '@/store/atoms/authAtom';
import {workerStatusState} from '@/store/atoms/userAtom';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import {WaitingScreen} from '@/screens/auth';

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
  const auth = useRecoilValue(authState);
  const workerStatus = useRecoilValue(workerStatusState);

  /**
   * 상태에 따른 초기 라우트 결정
   * - 비로그인: Auth (인증 플로우)
   * - REQUESTED/PENDING: Waiting (승인 대기)
   * - ACTIVE: Main (메인 화면)
   * - INACTIVE/BLOCKED: Auth (재인증 필요)
   */
  const getInitialRoute = (): 'Auth' | 'Waiting' | 'Main' => {
    // 로그인 안 됨
    if (!auth.isLoggedIn) {
      return 'Auth';
    }

    // 상태별 분기
    switch (workerStatus) {
      case 'REQUESTED':
      case 'PENDING':
        return 'Waiting';
      case 'ACTIVE':
        return 'Main';
      case 'INACTIVE':
      case 'BLOCKED':
      default:
        return 'Auth';
    }
  };

  const initialRoute = getInitialRoute();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}>
        {/* 조건부 렌더링으로 화면 스택 결정 */}
        {initialRoute === 'Auth' && (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
        {initialRoute === 'Waiting' && (
          <Stack.Screen name="Waiting" component={WaitingScreen} />
        )}
        {initialRoute === 'Main' && (
          <Stack.Screen name="Main" component={MainStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
