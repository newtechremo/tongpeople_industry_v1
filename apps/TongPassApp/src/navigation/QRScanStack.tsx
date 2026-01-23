/**
 * QR 스캔 스택 네비게이터
 * - QRScan (스캔 화면)
 * - ScanSuccess (성공 화면)
 * - ScanFailure (실패 화면)
 *
 * 팀 관리자(TEAM_ADMIN) 이상 권한에서 접근 가능
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {QRScanStackParamList} from '@/types/navigation';

import {QRScanScreen, ScanSuccessScreen, ScanFailureScreen} from '@/screens/qr';

const Stack = createNativeStackNavigator<QRScanStackParamList>();

const QRScanStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
      <Stack.Screen
        name="QRScan"
        component={QRScanScreen}
        initialParams={{mode: 'CHECK_IN'}}
      />
      <Stack.Screen name="ScanSuccess" component={ScanSuccessScreen} />
      <Stack.Screen name="ScanFailure" component={ScanFailureScreen} />
    </Stack.Navigator>
  );
};

export default QRScanStack;
