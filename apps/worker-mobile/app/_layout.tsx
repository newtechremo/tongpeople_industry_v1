import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
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
