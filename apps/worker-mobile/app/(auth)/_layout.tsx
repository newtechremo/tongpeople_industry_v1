/**
 * 인증 플로우 레이아웃
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#F97316',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontFamily: 'Pretendard-Bold',
          },
          headerBackTitle: '뒤로',
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: '로그인',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="company-code"
          options={{
            title: '회사코드 입력',
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            title: '정보 입력',
          }}
        />
      </Stack>
    </>
  );
}
