/**
 * Q03 스캔 실패 화면
 * - 오류 타입별 메시지 표시
 * - 다시 스캔 버튼
 */

import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {colors} from '@/constants/colors';
import {QRScanStackParamList} from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<
  QRScanStackParamList,
  'ScanFailure'
>;
type ScanFailureRouteProp = RouteProp<QRScanStackParamList, 'ScanFailure'>;

// 에러 타입 정의
type ErrorType =
  | 'INVALID_QR'
  | 'EXPIRED_QR'
  | 'ALREADY_CHECKED'
  | 'WORKER_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

// 에러 타입별 아이콘 및 제목
const ERROR_CONFIG: Record<
  ErrorType,
  {icon: string; title: string; defaultMessage: string}
> = {
  INVALID_QR: {
    icon: '⚠️',
    title: '인식 실패',
    defaultMessage: 'QR 코드를 인식할 수 없습니다.',
  },
  EXPIRED_QR: {
    icon: '⏱️',
    title: 'QR 코드 만료',
    defaultMessage: 'QR 코드가 만료되었습니다. 근로자에게 새로고침을 요청하세요.',
  },
  ALREADY_CHECKED: {
    icon: '✓',
    title: '중복 처리',
    defaultMessage: '이미 처리된 근로자입니다.',
  },
  WORKER_NOT_FOUND: {
    icon: '👤',
    title: '근로자 없음',
    defaultMessage: '등록되지 않은 근로자입니다.',
  },
  PERMISSION_DENIED: {
    icon: '🔒',
    title: '권한 없음',
    defaultMessage: '해당 근로자를 처리할 권한이 없습니다.',
  },
  NETWORK_ERROR: {
    icon: '📶',
    title: '네트워크 오류',
    defaultMessage: '네트워크 연결을 확인해주세요.',
  },
  UNKNOWN: {
    icon: '❌',
    title: '오류 발생',
    defaultMessage: '알 수 없는 오류가 발생했습니다.',
  },
};

const ScanFailureScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScanFailureRouteProp>();

  const {errorType = 'UNKNOWN', errorMessage, mode} = route.params;

  // 에러 설정 가져오기
  const errorConfig = ERROR_CONFIG[errorType] || ERROR_CONFIG.UNKNOWN;

  // 애니메이션
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  /**
   * 다시 스캔하기
   */
  const handleRetry = useCallback(() => {
    navigation.replace('QRScan', {mode});
  }, [navigation, mode]);

  /**
   * 닫기 (메인으로)
   */
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    // 입장 애니메이션 (흔들림 + 페이드인)
    Animated.parallel([
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim, opacityAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 실패 아이콘 */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{translateX: shakeAnim}],
              opacity: opacityAnim,
            },
          ]}>
          <Text style={styles.errorIcon}>{errorConfig.icon}</Text>
        </Animated.View>

        {/* 에러 제목 */}
        <Animated.View style={{opacity: opacityAnim}}>
          <Text style={styles.errorTitle}>{errorConfig.title}</Text>
        </Animated.View>

        {/* 에러 메시지 */}
        <Animated.View style={[styles.messageContainer, {opacity: opacityAnim}]}>
          <Text style={styles.errorMessage}>
            {errorMessage || errorConfig.defaultMessage}
          </Text>
        </Animated.View>

        {/* 도움말 (만료 시) */}
        {errorType === 'EXPIRED_QR' && (
          <Animated.View style={[styles.helpContainer, {opacity: opacityAnim}]}>
            <Text style={styles.helpText}>
              💡 근로자 앱에서 QR 코드를 새로고침하면{'\n'}
              새로운 코드가 생성됩니다.
            </Text>
          </Animated.View>
        )}

        {/* 네트워크 오류 시 도움말 */}
        {errorType === 'NETWORK_ERROR' && (
          <Animated.View style={[styles.helpContainer, {opacity: opacityAnim}]}>
            <Text style={styles.helpText}>
              💡 Wi-Fi 또는 모바일 데이터 연결 상태를{'\n'}
              확인하고 다시 시도해주세요.
            </Text>
          </Animated.View>
        )}
      </View>

      {/* 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>다시 스캔하기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>닫기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  // 실패 아이콘
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 56,
  },
  // 에러 제목
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 16,
  },
  // 에러 메시지
  messageContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  errorMessage: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  // 도움말
  helpContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  // 버튼 영역
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 12,
  },
  retryButton: {
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
});

export default ScanFailureScreen;
