/**
 * Q01 QR 스캔 화면
 * - 카메라 뷰 + 스캔 프레임
 * - 출근/퇴근 모드 토글
 * - 스캔 결과 처리 후 Success/Failure 화면 이동
 *
 * Note: 실제 카메라 기능은 react-native-vision-camera 또는
 * react-native-camera 라이브러리 설치 후 구현 필요
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {colors} from '@/constants/colors';
import {QRScanStackParamList} from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<QRScanStackParamList, 'QRScan'>;
type QRScanRouteProp = RouteProp<QRScanStackParamList, 'QRScan'>;

type ScanMode = 'CHECK_IN' | 'CHECK_OUT';

const QRScanScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QRScanRouteProp>();

  // 초기 모드 (파라미터로 전달 가능)
  const initialMode = route.params?.mode || 'CHECK_IN';
  const [scanMode, setScanMode] = useState<ScanMode>(initialMode);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * 스캔 모드 토글
   */
  const toggleMode = useCallback(() => {
    setScanMode(prev => (prev === 'CHECK_IN' ? 'CHECK_OUT' : 'CHECK_IN'));
  }, []);

  /**
   * QR 코드 스캔 완료 핸들러
   * - 실제 구현 시 카메라 라이브러리의 onBarCodeRead 등에서 호출
   */
  const handleQRScanned = useCallback(
    async (qrData: string) => {
      if (isProcessing) return;

      setIsProcessing(true);

      try {
        // TODO: API 호출
        // const response = scanMode === 'CHECK_IN'
        //   ? await scanCheckIn(qrData)
        //   : await scanCheckOut(qrData);

        // 임시: 성공 화면으로 이동 (테스트용)
        navigation.replace('ScanSuccess', {
          workerName: '홍길동',
          teamName: '생산1팀',
          checkTime: new Date().toISOString(),
          mode: scanMode,
        });
      } catch (error: any) {
        // 실패 화면으로 이동
        navigation.replace('ScanFailure', {
          errorType: 'INVALID_QR',
          errorMessage: error?.message || 'QR 코드를 인식할 수 없습니다.',
          mode: scanMode,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, navigation, scanMode],
  );

  /**
   * 테스트용 스캔 시뮬레이션
   */
  const simulateScan = useCallback(() => {
    Alert.alert('테스트 스캔', '스캔 결과를 선택하세요', [
      {
        text: '성공',
        onPress: () => handleQRScanned('test-qr-data'),
      },
      {
        text: '실패 (만료)',
        onPress: () => {
          navigation.replace('ScanFailure', {
            errorType: 'EXPIRED_QR',
            errorMessage: 'QR 코드가 만료되었습니다. 근로자에게 새로고침을 요청하세요.',
            mode: scanMode,
          });
        },
      },
      {
        text: '실패 (중복)',
        onPress: () => {
          navigation.replace('ScanFailure', {
            errorType: 'ALREADY_CHECKED',
            errorMessage:
              scanMode === 'CHECK_IN'
                ? '이미 출근 처리된 근로자입니다.'
                : '이미 퇴근 처리된 근로자입니다.',
            mode: scanMode,
          });
        },
      },
      {text: '취소', style: 'cancel'},
    ]);
  }, [handleQRScanned, navigation, scanMode]);

  /**
   * 뒤로가기
   */
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {scanMode === 'CHECK_IN' ? '출근 스캔' : '퇴근 스캔'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 카메라 영역 (Placeholder) */}
      <View style={styles.cameraContainer}>
        {/* 실제 카메라 뷰가 들어갈 자리 */}
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraPlaceholderText}>📷</Text>
          <Text style={styles.cameraPlaceholderLabel}>카메라 영역</Text>
          <Text style={styles.cameraPlaceholderHint}>
            react-native-vision-camera{'\n'}설치 후 구현
          </Text>
        </View>

        {/* 스캔 프레임 오버레이 */}
        <View style={styles.scanOverlay}>
          {/* 상단 어두운 영역 */}
          <View style={styles.overlayDark} />

          {/* 중앙 스캔 영역 */}
          <View style={styles.scanFrameRow}>
            <View style={styles.overlayDark} />
            <View style={styles.scanFrame}>
              {/* 코너 마커 */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.overlayDark} />
          </View>

          {/* 하단 어두운 영역 */}
          <View style={styles.overlayDark} />
        </View>
      </View>

      {/* 안내 텍스트 */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideText}>
          근로자의 QR 코드를 프레임 안에 위치시켜주세요
        </Text>
      </View>

      {/* 모드 토글 */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            scanMode === 'CHECK_IN' && styles.modeButtonActive,
          ]}
          onPress={() => setScanMode('CHECK_IN')}>
          <Text
            style={[
              styles.modeButtonText,
              scanMode === 'CHECK_IN' && styles.modeButtonTextActive,
            ]}>
            출근
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            scanMode === 'CHECK_OUT' && styles.modeButtonActiveCheckOut,
          ]}
          onPress={() => setScanMode('CHECK_OUT')}>
          <Text
            style={[
              styles.modeButtonText,
              scanMode === 'CHECK_OUT' && styles.modeButtonTextActive,
            ]}>
            퇴근
          </Text>
        </TouchableOpacity>
      </View>

      {/* 테스트 버튼 (개발용) */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={simulateScan}
        disabled={isProcessing}>
        {isProcessing ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.testButtonText}>테스트 스캔</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const SCAN_FRAME_SIZE = 280;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSpacer: {
    width: 40,
  },
  // 카메라
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    fontSize: 64,
    marginBottom: 16,
  },
  cameraPlaceholderLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  cameraPlaceholderHint: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
  },
  // 스캔 오버레이
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrameRow: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
  },
  // 코너 마커
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.primary,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.primary,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: colors.primary,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  // 안내 텍스트
  guideContainer: {
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  guideText: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  // 모드 토글
  modeToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 32,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.info,
  },
  modeButtonActiveCheckOut: {
    backgroundColor: colors.error,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  // 테스트 버튼
  testButton: {
    marginHorizontal: 32,
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default QRScanScreen;
