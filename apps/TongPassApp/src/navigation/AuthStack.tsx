import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthStackParamList} from '@/types/navigation';
import {colors} from '@/constants/colors';

import {
  CompanyCodeScreen,
  PhoneVerifyScreen,
  WorkerInfoScreen,
  TermsScreen,
  TermsDetailScreen,
  SignatureScreen,
  WaitingScreen,
} from '@/screens/auth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerTintColor: colors.textPrimary,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
      }}>
      <Stack.Screen
        name="CompanyCode"
        component={CompanyCodeScreen}
        options={{title: '회사코드 입력', headerShown: false}}
      />
      <Stack.Screen
        name="PhoneVerify"
        component={PhoneVerifyScreen}
        options={{title: '전화번호 인증'}}
      />
      <Stack.Screen
        name="WorkerInfo"
        component={WorkerInfoScreen}
        options={{title: '정보 입력'}}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{title: '약관 동의'}}
      />
      <Stack.Screen
        name="TermsDetail"
        component={TermsDetailScreen}
        options={({route}) => ({title: route.params.title})}
      />
      <Stack.Screen
        name="Signature"
        component={SignatureScreen}
        options={{title: '전자서명'}}
      />
      <Stack.Screen
        name="Waiting"
        component={WaitingScreen}
        options={{title: '승인 대기', headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
