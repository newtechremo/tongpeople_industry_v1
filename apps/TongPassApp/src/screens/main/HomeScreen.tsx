/**
 * 홈 화면
 * - 출퇴근 상태 표시
 * - 출퇴근 버튼
 * - 사용자 정보 표시
 */

import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {useRecoilState, useRecoilValue} from 'recoil';
import {colors} from '@/constants/colors';
import {userInfoState, commuteStatusState} from '@/store/atoms/userAtom';
import {
  selectedCompanyState,
  selectedSiteState,
} from '@/store/atoms/companyAtom';
import {getWorkerMe, commuteIn, commuteOut} from '@/api/worker';
import {useAuth} from '@/hooks/useAuth';
import {ApiError} from '@/types/api';

const HomeScreen: React.FC = () => {
  const {logout} = useAuth();
  const userInfo = useRecoilValue(userInfoState);
  const company = useRecoilValue(selectedCompanyState);
  const site = useRecoilValue(selectedSiteState);
  const [commuteStatus, setCommuteStatus] = useRecoilState(commuteStatusState);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  /**
   * 사용자 정보 및 출퇴근 상태 조회
   */
  const fetchUserData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      }

      try {
        const data = await getWorkerMe();
        setCommuteStatus(data.commuteStatus);
        if (data.checkInTime) {
          setCheckInTime(data.checkInTime);
        }
      } catch (error) {
        const apiError =
          error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');

        // 인증 에러는 자동 로그아웃
        if (apiError.requiresLogout) {
          return;
        }

        // 네트워크 에러는 무시 (오프라인 상태)
        if (apiError.code !== 'NETWORK_ERROR') {
          if (__DEV__) {
            console.warn('[HomeScreen] fetchUserData error:', error);
          }
        }
      } finally {
        setRefreshing(false);
      }
    },
    [setCommuteStatus],
  );

  /**
   * 초기 데이터 로드
   */
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  /**
   * 출퇴근 처리
   */
  const handleCommute = useCallback(async () => {
    if (commuteStatus === 'WORK_DONE') {
      return;
    }

    const isCheckIn = commuteStatus === 'WORK_OFF';
    const action = isCheckIn ? '출근' : '퇴근';
    const message = isCheckIn
      ? '출근하시겠습니까?'
      : '퇴근하시겠습니까?\n퇴근 후에는 재출근이 불가합니다.';

    Alert.alert(action, message, [
      {text: '취소', style: 'cancel'},
      {
        text: '확인',
        onPress: async () => {
          setLoading(true);

          try {
            if (isCheckIn) {
              const result = await commuteIn();
              setCommuteStatus('WORK_ON');
              setCheckInTime(result.checkInTime);
              Alert.alert('출근 완료', '출근이 정상적으로 처리되었습니다.');
            } else {
              const result = await commuteOut();
              setCommuteStatus('WORK_DONE');

              const hours = Math.floor(result.workDuration / 60);
              const minutes = result.workDuration % 60;
              const durationText =
                hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;

              Alert.alert(
                '퇴근 완료',
                `퇴근이 정상적으로 처리되었습니다.\n오늘 근무시간: ${durationText}`,
              );
            }
          } catch (error) {
            const apiError =
              error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');
            Alert.alert('오류', apiError.userMessage);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [commuteStatus, setCommuteStatus]);

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

  /**
   * 버튼 스타일 결정
   */
  const getButtonStyle = () => {
    switch (commuteStatus) {
      case 'WORK_OFF':
        return styles.buttonIn;
      case 'WORK_ON':
        return styles.buttonOut;
      case 'WORK_DONE':
        return styles.buttonDone;
      default:
        return styles.buttonIn;
    }
  };

  /**
   * 버튼 텍스트 결정
   */
  const getButtonText = () => {
    if (loading) {
      return '';
    }
    switch (commuteStatus) {
      case 'WORK_OFF':
        return '출근하기';
      case 'WORK_ON':
        return '퇴근하기';
      case 'WORK_DONE':
        return '퇴근 완료';
      default:
        return '출근하기';
    }
  };

  /**
   * 상태 텍스트 결정
   */
  const getStatusText = () => {
    switch (commuteStatus) {
      case 'WORK_OFF':
        return '출근 전';
      case 'WORK_ON':
        return '근무 중';
      case 'WORK_DONE':
        return '퇴근 완료';
      default:
        return '출근 전';
    }
  };

  /**
   * 출근 시간 포맷
   */
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // 사용자 이름 (기본값 처리)
  const userName = userInfo?.name || '근로자';
  const companyName = company?.name || site?.name || '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchUserData(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요, {userName}님</Text>
            {companyName ? (
              <Text style={styles.company}>{companyName}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>

        {/* 콘텐츠 */}
        <View style={styles.content}>
          {/* 상태 카드 */}
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>현재 상태</Text>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            {checkInTime && commuteStatus !== 'WORK_OFF' && (
              <Text style={styles.checkInTimeText}>
                출근 시간: {formatTime(checkInTime)}
              </Text>
            )}
          </View>

          {/* 출퇴근 버튼 */}
          <TouchableOpacity
            style={[styles.commuteButton, getButtonStyle()]}
            onPress={handleCommute}
            disabled={commuteStatus === 'WORK_DONE' || loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Text style={styles.commuteButtonText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>

          {/* 날짜 */}
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    width: '100%',
    padding: 24,
    backgroundColor: colors.backgroundGray,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  checkInTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  commuteButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonIn: {
    backgroundColor: colors.info,
  },
  buttonOut: {
    backgroundColor: colors.error,
  },
  buttonDone: {
    backgroundColor: colors.textDisabled,
  },
  commuteButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default HomeScreen;
