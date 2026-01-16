/**
 * 승인 대기 화면
 * - 가입 요청 완료 후 관리자 승인 대기 상태 표시
 * - 주기적으로 상태 확인 (폴링)
 * - 승인 완료 시 자동으로 메인 화면 이동
 */

import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import {useRecoilValue, useSetRecoilState} from 'recoil';
import {colors} from '@/constants/colors';
import {userInfoState, workerStatusState} from '@/store/atoms/userAtom';
import {checkWorkerStatus} from '@/api/auth';
import {ApiError} from '@/types/api';
import {useAuth} from '@/hooks/useAuth';
import {formatPhoneNumber} from '@/utils/format';

// 상태 확인 주기 (밀리초)
const POLL_INTERVAL = 30000; // 30초

const WaitingScreen: React.FC = () => {
  const userInfo = useRecoilValue(userInfoState);
  const setWorkerStatus = useSetRecoilState(workerStatusState);
  const {logout} = useAuth();

  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  /**
   * 상태 확인
   */
  const checkStatus = useCallback(
    async (showAlert = true) => {
      if (!userInfo?.id) {
        if (showAlert) {
          Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
        }
        return;
      }

      setLoading(true);

      try {
        const result = await checkWorkerStatus(userInfo.id);
        setLastChecked(new Date());

        if (result.status === 'ACTIVE') {
          // 승인 완료
          setWorkerStatus('ACTIVE');
          Alert.alert(
            '승인 완료',
            '가입이 승인되었습니다. 서비스를 이용하실 수 있습니다.',
          );
          // RootNavigator에서 상태 변경 감지하여 자동으로 메인 화면 이동
        } else if (result.status === 'BLOCKED') {
          // 거절됨
          setWorkerStatus('BLOCKED');
          Alert.alert(
            '가입 거절',
            '가입 요청이 거절되었습니다. 관리자에게 문의해주세요.',
          );
        } else if (result.status === 'INACTIVE') {
          // 비활성화
          setWorkerStatus('INACTIVE');
          Alert.alert(
            '계정 비활성화',
            '계정이 비활성화되었습니다. 관리자에게 문의해주세요.',
          );
        } else if (showAlert) {
          // 여전히 대기 중
          Alert.alert('알림', '아직 승인 대기 중입니다.');
        }
      } catch (error) {
        const apiError =
          error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');

        if (apiError.code === 'NETWORK_ERROR' && showAlert) {
          Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
        } else if (showAlert) {
          Alert.alert('오류', apiError.userMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [userInfo?.id, setWorkerStatus],
  );

  /**
   * 앱 상태 변화 처리 (포그라운드로 돌아올 때 상태 확인)
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 포그라운드로 돌아왔을 때 상태 확인
        checkStatus(false);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [checkStatus]);

  /**
   * 폴링 설정
   */
  useEffect(() => {
    // 초기 상태 확인
    checkStatus(false);

    // 주기적 상태 확인
    pollIntervalRef.current = setInterval(() => {
      checkStatus(false);
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [checkStatus]);

  /**
   * 로그아웃 처리
   */
  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '확인',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }, [logout]);

  // 사용자 정보 포맷팅
  const displayName = userInfo?.name || '사용자';
  const displayPhone = userInfo?.phoneNumber
    ? formatPhoneNumber(userInfo.phoneNumber).replace(
        /(\d{3})-(\d{4})-(\d{4})/,
        '$1-$2-****',
      )
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 아이콘 */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        {/* 제목 */}
        <Text style={styles.title}>가입 요청이 완료되었습니다</Text>
        <Text style={styles.subtitle}>관리자 승인 후 이용 가능합니다</Text>

        {/* 내 정보 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>내 정보</Text>
          <Text style={styles.infoText}>
            {displayName} / {displayPhone}
          </Text>
        </View>

        {/* 상태 확인 버튼 */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => checkStatus(true)}
          disabled={loading}
          activeOpacity={0.7}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.refreshButtonText}>상태 새로고침</Text>
          )}
        </TouchableOpacity>

        {/* 마지막 확인 시간 */}
        {lastChecked && (
          <Text style={styles.lastCheckedText}>
            마지막 확인: {lastChecked.toLocaleTimeString('ko-KR')}
          </Text>
        )}

        {/* 안내 메시지 */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>잠깐!</Text>
          <Text style={styles.helpText}>
            • 승인은 관리자 확인 후 처리됩니다{'\n'}• 승인이 완료되면 자동으로
            화면이 전환됩니다{'\n'}• 문의사항은 현장 관리자에게 연락해주세요
          </Text>
        </View>
      </View>

      {/* 하단 로그아웃 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    padding: 20,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  refreshButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  lastCheckedText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.textDisabled,
  },
  helpCard: {
    width: '100%',
    padding: 16,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginTop: 24,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default WaitingScreen;
