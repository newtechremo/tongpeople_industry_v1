import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { QR_VALIDITY_SECONDS, QR_REFRESH_INTERVAL_SECONDS } from '@tong-pass/shared';

export default function QRScreen() {
  const [qrData, setQrData] = useState('');
  const [countdown, setCountdown] = useState(QR_VALIDITY_SECONDS);

  // QR 데이터 생성
  const generateQRData = () => {
    const payload = {
      workerId: 'worker-001',  // 실제로는 로그인된 사용자 ID
      timestamp: Date.now(),
      expiresAt: Date.now() + QR_VALIDITY_SECONDS * 1000,
    };
    return JSON.stringify(payload);
  };

  // QR 갱신
  useEffect(() => {
    setQrData(generateQRData());
    setCountdown(QR_VALIDITY_SECONDS);

    const refreshInterval = setInterval(() => {
      setQrData(generateQRData());
      setCountdown(QR_VALIDITY_SECONDS);
    }, QR_REFRESH_INTERVAL_SECONDS * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // 카운트다운
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : QR_VALIDITY_SECONDS));
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center px-6">
        {/* QR 코드 카드 */}
        <View className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 items-center">
          <Text className="text-lg font-bold text-slate-700 mb-6">출근 QR 코드</Text>

          {/* QR 코드 */}
          <View className="bg-white p-4 rounded-2xl border-4 border-orange-500">
            {qrData && (
              <QRCode
                value={qrData}
                size={200}
                color="#1E293B"
                backgroundColor="#FFFFFF"
              />
            )}
          </View>

          {/* 카운트다운 */}
          <View className="mt-6 items-center">
            <Text className="text-sm text-slate-400">QR 코드 갱신까지</Text>
            <Text className="text-3xl font-black text-orange-600 mt-1">
              {countdown}초
            </Text>
          </View>

          {/* 안내 문구 */}
          <View className="mt-6 bg-orange-50 rounded-xl p-4">
            <Text className="text-sm text-orange-700 text-center leading-5">
              관리자에게 이 QR 코드를 보여주세요.{'\n'}
              보안을 위해 {QR_REFRESH_INTERVAL_SECONDS}초마다 자동 갱신됩니다.
            </Text>
          </View>
        </View>

        {/* 사용자 정보 */}
        <View className="mt-8 items-center">
          <Text className="text-lg font-bold text-slate-700">홍길동</Text>
          <Text className="text-sm text-slate-500 mt-1">(주)정이앤지</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
