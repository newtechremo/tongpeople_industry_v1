/**
 * M04 출퇴근 기록 화면
 * - 월 선택기 (좌우 화살표)
 * - 월간 요약 (출근일수, 총 근무시간)
 * - 일별 기록 리스트
 */

import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {colors} from '@/constants/colors';

// 타입 정의
interface AttendanceSummary {
  workDays: number;
  totalMinutes: number;
}

interface AttendanceRecord {
  id: string;
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'WORK_ON' | 'WORK_DONE' | 'NO_RECORD';
  totalMinutes: number;
  isAutoOut: boolean;
}

const AttendanceHistoryScreen: React.FC = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  /**
   * 오늘 날짜 정보
   */
  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      dateString: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    };
  }, []);

  /**
   * 다음 달로 이동 가능 여부
   */
  const canGoNext = useMemo(() => {
    return !(currentYear === today.year && currentMonth === today.month);
  }, [currentYear, currentMonth, today]);

  /**
   * 출퇴근 기록 로드
   */
  const fetchAttendanceData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        // TODO: 실제 API 연동 (GET /attendance-history?year=&month=)
        // 현재는 더미 데이터 사용
        await new Promise<void>(resolve => setTimeout(resolve, 500));

        // 더미 데이터 생성
        const dummyRecords: AttendanceRecord[] = [];
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

        for (let day = Math.min(daysInMonth, today.day); day >= 1; day--) {
          // 현재 달이고 오늘 이후면 스킵
          if (
            currentYear === today.year &&
            currentMonth === today.month &&
            day > today.day
          ) {
            continue;
          }

          const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateString === today.dateString;

          // 주말(토,일) 또는 랜덤으로 일부 날짜 제외
          const date = new Date(currentYear, currentMonth - 1, day);
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          if (isWeekend || (!isToday && Math.random() > 0.7)) {
            continue;
          }

          const checkInHour = 8 + Math.floor(Math.random() * 2);
          const checkInMin = Math.floor(Math.random() * 60);
          const checkOutHour = 17 + Math.floor(Math.random() * 2);
          const checkOutMin = Math.floor(Math.random() * 60);

          dummyRecords.push({
            id: `attendance-${dateString}`,
            workDate: dateString,
            checkInTime: `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}`,
            checkOutTime: isToday
              ? null
              : `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}`,
            status: isToday ? 'WORK_ON' : 'WORK_DONE',
            totalMinutes: isToday
              ? Math.floor((Date.now() - new Date(currentYear, currentMonth - 1, day, checkInHour, checkInMin).getTime()) / 60000)
              : (checkOutHour - checkInHour) * 60 + (checkOutMin - checkInMin),
            isAutoOut: !isToday && Math.random() > 0.8,
          });
        }

        setRecords(dummyRecords);
        setSummary({
          workDays: dummyRecords.length,
          totalMinutes: dummyRecords.reduce((acc, r) => acc + r.totalMinutes, 0),
        });
      } catch (error) {
        console.error('Failed to fetch attendance data:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentYear, currentMonth, today],
  );

  /**
   * 월 변경 시 데이터 로드
   */
  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  /**
   * 이전 달로 이동
   */
  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 1) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  }, [currentMonth]);

  /**
   * 다음 달로 이동
   */
  const handleNextMonth = useCallback(() => {
    if (!canGoNext) return;

    if (currentMonth === 12) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  }, [currentMonth, canGoNext]);

  /**
   * 시간 포맷팅 (분 → X시간 X분)
   */
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayNames[date.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  };

  /**
   * 일별 기록 카드 렌더링
   */
  const renderRecordCard = useCallback(
    ({item}: {item: AttendanceRecord}) => {
      const isToday = item.workDate === today.dateString;
      const isWorking = item.status === 'WORK_ON';

      return (
        <View style={styles.recordCard}>
          {/* 날짜 헤더 */}
          <View style={styles.recordHeader}>
            <Text style={styles.recordDate}>{formatDate(item.workDate)}</Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>오늘</Text>
              </View>
            )}
          </View>

          {/* 출퇴근 시간 */}
          <View style={styles.recordTimes}>
            <Text style={styles.recordTimeLabel}>
              출근{' '}
              <Text style={styles.recordTimeValue}>
                {item.checkInTime || '--:--'}
              </Text>
            </Text>
            <Text style={styles.recordTimeSeparator}>│</Text>
            <Text style={styles.recordTimeLabel}>
              퇴근{' '}
              <Text style={styles.recordTimeValue}>
                {item.checkOutTime || '--:--'}
              </Text>
            </Text>
          </View>

          {/* 상태 및 근무시간 */}
          <View style={styles.recordStatus}>
            {isWorking ? (
              <Text style={styles.statusWorking}>
                근무중 · {formatDuration(item.totalMinutes)}
              </Text>
            ) : (
              <Text
                style={[
                  styles.statusDone,
                  item.isAutoOut && styles.statusAutoOut,
                ]}>
                {formatDuration(item.totalMinutes)}
                {item.isAutoOut && ' · 자동퇴근'}
              </Text>
            )}
          </View>
        </View>
      );
    },
    [today.dateString],
  );

  /**
   * 빈 상태 렌더링
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>
        이번 달 출퇴근 기록이 없습니다
      </Text>
    </View>
  );

  /**
   * 헤더 컴포넌트 (요약 카드)
   */
  const renderHeader = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>이번 달 근무 요약</Text>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>출근일수</Text>
          <Text style={styles.summaryValue}>
            {summary?.workDays || 0}일
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>총 근무시간</Text>
          <Text style={styles.summaryValue}>
            {Math.floor((summary?.totalMinutes || 0) / 60)}시간
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>출퇴근 기록</Text>
      </View>

      {/* 월 선택기 */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={handlePrevMonth}>
          <Text style={styles.monthArrowText}>◀</Text>
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {currentYear}년 {currentMonth}월
        </Text>

        <TouchableOpacity
          style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
          onPress={handleNextMonth}
          disabled={!canGoNext}>
          <Text
            style={[
              styles.monthArrowText,
              !canGoNext && styles.monthArrowTextDisabled,
            ]}>
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      {/* 콘텐츠 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          renderItem={renderRecordCard}
          ListHeaderComponent={records.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAttendanceData(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  // 월 선택기
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthArrow: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthArrowDisabled: {
    opacity: 0.3,
  },
  monthArrowText: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  monthArrowTextDisabled: {
    color: colors.textDisabled,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginHorizontal: 16,
  },
  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 리스트
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // 요약 카드
  summaryCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C2410C',
    marginBottom: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#FED7AA',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  // 일별 기록 카드
  recordCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  todayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  recordTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordTimeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recordTimeValue: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recordTimeSeparator: {
    marginHorizontal: 16,
    color: colors.border,
  },
  recordStatus: {},
  statusWorking: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EA580C',
  },
  statusDone: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statusAutoOut: {
    color: colors.textSecondary,
  },
  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default AttendanceHistoryScreen;
