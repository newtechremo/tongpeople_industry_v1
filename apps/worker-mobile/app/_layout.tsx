import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import '../global.css';

// 앱 시작 시 스플래시 화면 유지
SplashScreen.preventAutoHideAsync();

// 로딩 화면 컴포넌트
function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#F97316" />
      <Text className="mt-4 text-slate-500">로딩 중...</Text>
    </View>
  );
}

// 인증 상태에 따른 라우팅
function RootLayoutNav() {
  const { isAuthenticated, isLoading, status } = useAuth();

  // 로딩 중
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 미로그인 → 로그인 화면
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // 승인 대기 상태
  if (status === 'PENDING' || status === 'REQUESTED') {
    return <Redirect href="/pending" />;
  }

  // 차단됨
  if (status === 'BLOCKED') {
    return <Redirect href="/blocked" />;
  }

  // 비활성 (퇴사 등)
  if (status === 'INACTIVE') {
    return <Redirect href="/blocked" />;
  }

  // 정상 (ACTIVE) → 메인 화면
  return (
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
      {/* 인증 화면은 별도 그룹으로 처리 */}
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
        }}
      />
      {/* 상태 화면들 */}
      <Stack.Screen
        name="pending"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="blocked"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

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
    <AuthProvider>
      <StatusBar style="light" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
