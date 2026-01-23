/**
 * Q02 스캔 성공 화면
 * - 근로자 정보 표시
 * - 3초 후 자동으로 스캔 화면으로 복귀
 * - 수동 확인 버튼
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
  'ScanSuccess'
>;
type ScanSuccessRouteProp = RouteProp<QRScanStackParamList, 'ScanSuccess'>;

const AUTO_CLOSE_SECONDS = 3;

const ScanSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScanSuccessRouteProp>();

  const {workerName, teamName, checkTime, mode} = route.params;

  // 애니메이션
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // 자동 닫기 타이머
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 화면 닫기 및 스캔 화면으로 복귀
   */
  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    navigation.replace('QRScan', {mode});
  }, [navigation, mode]);

  /**
   * 시간 포맷팅
   */
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    // 입장 애니메이션
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 자동 닫기 타이머
    timerRef.current = setTimeout(() => {
      handleClose();
    }, AUTO_CLOSE_SECONDS * 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [handleClose, scaleAnim, opacityAnim]);

  const isCheckIn = mode === 'CHECK_IN';

  return (
    <SafeAreaView
      style={[
        styles.container,
        {backgroundColor: isCheckIn ? colors.info : colors.error},
      ]}>
      <View style={styles.content}>
        {/* 성공 아이콘 */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{scale: scaleAnim}],
              opacity: opacityAnim,
            },
          ]}>
          <Text style={styles.successIcon}>✓</Text>
        </Animated.View>

        {/* 상태 텍스트 */}
        <Animated.View style={{opacity: opacityAnim}}>
          <Text style={styles.statusText}>
            {isCheckIn ? '출근 완료' : '퇴근 완료'}
          </Text>
        </Animated.View>

        {/* 근로자 정보 */}
        <Animated.View style={[styles.infoCard, {opacity: opacityAnim}]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>이름</Text>
            <Text style={styles.infoValue}>{workerName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>소속</Text>
            <Text style={styles.infoValue}>{teamName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {isCheckIn ? '출근 시간' : '퇴근 시간'}
            </Text>
            <Text style={styles.infoValue}>{formatTime(checkTime)}</Text>
          </View>
        </Animated.View>

        {/* 자동 닫힘 안내 */}
        <Text style={styles.autoCloseText}>
          {AUTO_CLOSE_SECONDS}초 후 자동으로 닫힙니다
        </Text>
      </View>

      {/* 확인 버튼 */}
      <TouchableOpacity style={styles.confirmButton} onPress={handleClose}>
        <Text style={styles.confirmButtonText}>확인</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  // 성공 아이콘
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 64,
    color: '#FFF',
    fontWeight: 'bold',
  },
  // 상태 텍스트
  statusText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 32,
  },
  // 정보 카드
  infoCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  // 자동 닫힘 안내
  autoCloseText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  // 확인 버튼
  confirmButton: {
    marginHorizontal: 32,
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default ScanSuccessScreen;
