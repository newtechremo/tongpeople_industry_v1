/**
 * 동적 QR 코드 컴포넌트
 * - 30초마다 자동 갱신
 * - 서버에서 서명된 페이로드 사용
 * - 만료 타이머 표시
 */

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {colors} from '@/constants/colors';
import {getQRPayload, QRPayloadResponse} from '@/api/worker';
import {ApiError} from '@/types/api';

interface DynamicQRCodeProps {
  size?: number;
  onError?: (error: ApiError) => void;
}

const DynamicQRCode: React.FC<DynamicQRCodeProps> = ({
  size = 200,
  onError,
}) => {
  const [qrData, setQrData] = useState<QRPayloadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(30);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * QR 페이로드 가져오기
   */
  const fetchQRPayload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getQRPayload();
      setQrData(data);
      setRemainingSeconds(data.expiresInSeconds);
    } catch (err) {
      const apiError =
        err instanceof ApiError ? err : new ApiError('UNKNOWN_ERROR');
      setError(apiError.userMessage);
      onError?.(apiError);

      if (__DEV__) {
        console.error('[DynamicQRCode] fetchQRPayload error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [onError]);

  /**
   * 초기 로드 및 30초마다 갱신
   */
  useEffect(() => {
    fetchQRPayload();

    // 30초마다 자동 갱신
    timerRef.current = setInterval(() => {
      fetchQRPayload();
    }, 30000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [fetchQRPayload]);

  /**
   * 남은 시간 카운트다운
   */
  useEffect(() => {
    if (!qrData) return;

    countdownRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          return 30; // 갱신 후 리셋됨
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [qrData]);

  /**
   * 수동 새로고침
   */
  const handleRefresh = useCallback(() => {
    if (!loading) {
      fetchQRPayload();
    }
  }, [loading, fetchQRPayload]);

  /**
   * QR 코드에 인코딩할 데이터
   */
  const getQRString = useCallback(() => {
    if (!qrData) return '';

    return JSON.stringify({
      workerId: qrData.workerId,
      timestamp: qrData.timestamp,
      expiresAt: qrData.expiresAt,
      signature: qrData.signature,
    });
  }, [qrData]);

  // 로딩 상태
  if (loading && !qrData) {
    return (
      <View style={[styles.container, {width: size, height: size}]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>QR 코드 생성 중...</Text>
      </View>
    );
  }

  // 에러 상태
  if (error && !qrData) {
    return (
      <View style={[styles.container, {width: size, height: size}]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* QR 코드 */}
      <View style={styles.qrContainer}>
        <QRCode
          value={getQRString()}
          size={size}
          color={colors.textPrimary}
          backgroundColor={colors.background}
        />

        {/* 로딩 오버레이 (갱신 중) */}
        {loading && (
          <View style={[styles.loadingOverlay, {width: size, height: size}]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>

      {/* 타이머 및 새로고침 */}
      <View style={styles.timerContainer}>
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>남은 시간</Text>
          <Text style={styles.timerValue}>{remainingSeconds}초</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={loading}>
          <Text style={styles.refreshText}>새로고침</Text>
        </TouchableOpacity>
      </View>

      {/* 안내 문구 */}
      <Text style={styles.infoText}>관리자에게 QR 코드를 보여주세요</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    minWidth: 40,
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundGray,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default DynamicQRCode;
