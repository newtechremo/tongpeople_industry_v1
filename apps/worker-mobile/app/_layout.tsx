import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import '../global.css';

// 앱 시작 시 스플래시 화면 유지
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // 폰트 로딩 완료 후 스플래시 숨기기
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // 폰트 로딩 중에는 아무것도 렌더링하지 않음
  if (!fontsLoaded && !fontError) {
    return null;
  }

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
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: '산업현장통',
          }}
        />
        <Stack.Screen
          name="qr"
          options={{
            title: '출근 QR',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: '출퇴근 기록',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: '회사 정보',
          }}
        />
      </Stack>
    </>
  );
}
