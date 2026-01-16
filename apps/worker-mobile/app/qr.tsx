/**
 * QR 코드 출근 화면
 *
 * 서명된 QR 코드를 생성하여 관리자가 스캔할 수 있도록 합니다.
 * QR 코드는 30초마다 자동 갱신됩니다.
 */
import { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { QR_VALIDITY_SECONDS, QR_REFRESH_INTERVAL_SECONDS } from '@tong-pass/shared';
import { useAuth } from '../src/context/AuthContext';
import {
  generateSignedQR,
  stringifyQRPayload,
  type QRPayload,
} from '../src/utils/qrSigner';

export default function QRScreen() {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<string>('');
  const [qrPayload, setQrPayload] = useState<QRPayload | null>(null);
  const [countdown, setCountdown] = useState(QR_VALIDITY_SECONDS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QR 데이터 생성
  const generateQR = useCallback(async () => {
    if (!user?.id) {
      setError('사용자 정보를 불러올 수 없습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const validityMs = QR_VALIDITY_SECONDS * 1000;
      const payload = await generateSignedQR(user.id, validityMs);
      setQrPayload(payload);
      setQrData(stringifyQRPayload(payload));
      setCountdown(QR_VALIDITY_SECONDS);
      setIsLoading(false);
    } catch (err: any) {
      console.error('QR 생성 실패:', err);
      setError('QR 코드 생성에 실패했습니다.');
      setIsLoading(false);
    }
  }, [user?.id]);

  // QR 갱신 (30초마다)
  useEffect(() => {
    generateQR();

    const refreshInterval = setInterval(() => {
      generateQR();
    }, QR_REFRESH_INTERVAL_SECONDS * 1000);

    return () => clearInterval(refreshInterval);
  }, [generateQR]);

  // 카운트다운
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return QR_VALIDITY_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  // 로딩 중
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-slate-500 mt-4">QR 코드 생성 중...</Text>
      </SafeAreaView>
    );
  }

  // 에러
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <View className="bg-red-50 p-6 rounded-2xl">
          <Text className="text-red-600 text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text
              className={`text-3xl font-black mt-1 ${
                countdown <= 5 ? 'text-red-500' : 'text-orange-600'
              }`}
            >
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
        {user && (
          <View className="mt-8 items-center">
            <Text className="text-lg font-bold text-slate-700">{user.name}</Text>
            {user.partner_name && (
              <Text className="text-sm text-slate-500 mt-1">{user.partner_name}</Text>
            )}
          </View>
        )}

        {/* 보안 안내 */}
        <View className="mt-6 px-4">
          <Text className="text-xs text-slate-400 text-center">
            QR 코드는 암호화된 서명을 포함하여{'\n'}
            캡처나 복사로 위변조할 수 없습니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
