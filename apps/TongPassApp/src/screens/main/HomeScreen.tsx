/**
 * 홈 화면
 * - M01: 출근 전 - 출근 버튼 (파랑)
 * - M02: 근무 중 - QR 코드 표시 + 퇴근 버튼 (빨강)
 * - M03: 퇴근 완료 - 완료 메시지 + 비활성 버튼
 */

import React, {useState, useCallback, useEffect, useMemo} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRecoilState, useRecoilValue} from 'recoil';
import {RootStackParamList} from '@/types/navigation';
import {colors} from '@/constants/colors';
import {userInfoState, commuteStatusState} from '@/store/atoms/userAtom';
import {
  selectedCompanyState,
  selectedSiteState,
} from '@/store/atoms/companyAtom';
import {getWorkerMe, commuteIn, commuteOut} from '@/api/worker';
import {useAuth} from '@/hooks/useAuth';
import {ApiError} from '@/types/api';
import DynamicQRCode from '@/components/qr/DynamicQRCode';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 팀 관리자 이상 권한 체크
const ADMIN_ROLES = ['TEAM_ADMIN', 'SITE_ADMIN', 'SUPER_ADMIN'];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
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
   * 상태 카드 스타일 결정
   */
  const getStatusCardStyle = () => {
    switch (commuteStatus) {
      case 'WORK_OFF':
        return styles.statusCardOff;
      case 'WORK_ON':
        return styles.statusCardOn;
      case 'WORK_DONE':
        return styles.statusCardDone;
      default:
        return styles.statusCardOff;
    }
  };

  /**
   * 상태 텍스트 스타일 결정
   */
  const getStatusTextStyle = () => {
    switch (commuteStatus) {
      case 'WORK_OFF':
        return styles.statusTextOff;
      case 'WORK_ON':
        return styles.statusTextOn;
      case 'WORK_DONE':
        return styles.statusTextDone;
      default:
        return styles.statusTextOff;
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

  // 관리자 권한 체크 (TEAM_ADMIN 이상)
  const isAdmin = useMemo(() => {
    return userInfo?.role && ADMIN_ROLES.includes(userInfo.role);
  }, [userInfo?.role]);

  /**
   * QR 스캔 화면 이동
   */
  const handleOpenQRScan = useCallback(() => {
    navigation.navigate('QRScanStack', {mode: 'CHECK_IN'});
  }, [navigation]);

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
          {/* 날짜 */}
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>

          {/* 상태 카드 */}
          <View style={[styles.statusCard, getStatusCardStyle()]}>
            <Text style={styles.statusLabel}>현재 상태</Text>
            <Text style={[styles.statusText, getStatusTextStyle()]}>
              {getStatusText()}
            </Text>
            {checkInTime && commuteStatus !== 'WORK_OFF' && (
              <Text style={styles.checkInTimeText}>
                출근 시간: {formatTime(checkInTime)}
              </Text>
            )}
          </View>

          {/* M02 상태: QR 코드 표시 */}
          {commuteStatus === 'WORK_ON' && (
            <View style={styles.qrSection}>
              <DynamicQRCode size={180} />
            </View>
          )}

          {/* M03 상태: 완료 메시지 */}
          {commuteStatus === 'WORK_DONE' && (
            <View style={styles.completedSection}>
              <View style={styles.checkIcon}>
                <Text style={styles.checkIconText}>✓</Text>
              </View>
              <Text style={styles.completedTitle}>오늘 근무 완료</Text>
              <Text style={styles.completedSubtitle}>
                내일도 안전한 하루 되세요!
              </Text>
            </View>
          )}

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
        </View>
      </ScrollView>

      {/* QR 스캔 플로팅 버튼 (관리자 전용) */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.qrScanFab}
          onPress={handleOpenQRScan}
          activeOpacity={0.8}>
          <Text style={styles.qrScanFabIcon}>📷</Text>
          <Text style={styles.qrScanFabText}>QR 스캔</Text>
        </TouchableOpacity>
      )}
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
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  // 상태 카드 기본
  statusCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  statusCardOff: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.info,
  },
  statusCardOn: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.error,
  },
  statusCardDone: {
    backgroundColor: colors.backgroundGray,
    borderColor: colors.border,
  },
  statusLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusTextOff: {
    color: colors.info,
  },
  statusTextOn: {
    color: colors.error,
  },
  statusTextDone: {
    color: colors.textDisabled,
  },
  checkInTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  // QR 코드 섹션 (M02)
  qrSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  // 완료 섹션 (M03)
  completedSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  checkIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkIconText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  // 출퇴근 버튼
  commuteButton: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIn: {
    backgroundColor: colors.info,
  },
  buttonOut: {
    backgroundColor: colors.error,
  },
  buttonDone: {
    backgroundColor: colors.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  commuteButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // QR 스캔 플로팅 버튼 (관리자 전용)
  qrScanFab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  qrScanFabIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  qrScanFabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
