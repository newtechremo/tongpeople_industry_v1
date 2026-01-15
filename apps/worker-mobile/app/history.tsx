/**
 * 출퇴근 기록 화면
 */
import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getMyAttendance,
  getMonthSummary,
  getMonthDateRange,
  type AttendanceRecord,
  type AttendanceSummary,
} from '../src/api/attendance';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  return `${month}/${day} (${dayOfWeek})`;
};

const formatTime = (timeStr: string | null) => {
  if (!timeStr) return '--:--';
  // "HH:MM:SS" or "HH:MM" 형식에서 HH:MM만 추출
  return timeStr.substring(0, 5);
};

const calculateWorkHours = (checkIn: string, checkOut: string | null): string => {
  if (!checkIn || !checkOut) return '-';

  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  const hours = outH - inH + (outM - inM) / 60;

  if (hours <= 0) return '-';
  return `${hours.toFixed(1)}시간`;
};

export default function HistoryScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const { startDate, endDate } = getMonthDateRange(currentYear, currentMonth);

      const [recordsData, summaryData] = await Promise.all([
        getMyAttendance(startDate, endDate),
        getMonthSummary(currentYear, currentMonth),
      ]);

      setRecords(recordsData);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('출퇴근 기록 조회 실패:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={['bottom']}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-slate-500 mt-4">기록을 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6" edges={['bottom']}>
        <Text className="text-red-500 text-center">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1 px-4 py-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#F97316']}
            tintColor="#F97316"
          />
        }
      >
        {/* 이번 달 요약 */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-slate-700 mb-4">
            {currentMonth}월 근무 현황
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-3xl font-black text-orange-600">
                {summary?.workDays ?? 0}
              </Text>
              <Text className="text-sm text-slate-400 mt-1">출근일</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-black text-slate-700">
                {summary?.totalHours ?? 0}
              </Text>
              <Text className="text-sm text-slate-400 mt-1">총 근무시간</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-black text-green-600">
                {summary?.attendanceRate ?? 0}%
              </Text>
              <Text className="text-sm text-slate-400 mt-1">출석률</Text>
            </View>
          </View>
        </View>

        {/* 출퇴근 기록 리스트 */}
        <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
          최근 기록
        </Text>

        {records.length === 0 ? (
          <View className="bg-white rounded-xl p-8 border border-gray-100 items-center">
            <Text className="text-slate-400">이번 달 출퇴근 기록이 없습니다.</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {records.map((record) => (
              <View
                key={record.id}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-base font-bold text-slate-700">
                    {formatDate(record.work_date)}
                  </Text>
                  <Text className="text-xs text-slate-400">
                    {record.site_name || '현장'}
                  </Text>
                </View>
                <View className="flex-row">
                  <View className="flex-1">
                    <Text className="text-xs text-slate-400">출근</Text>
                    <Text className="text-lg font-bold text-green-600">
                      {formatTime(record.check_in_time)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-400">퇴근</Text>
                    <Text className={`text-lg font-bold ${record.check_out_time ? 'text-blue-600' : 'text-slate-300'}`}>
                      {formatTime(record.check_out_time)}
                    </Text>
                  </View>
                  <View className="flex-1 items-end justify-center">
                    <Text className="text-sm font-bold text-slate-600">
                      {calculateWorkHours(record.check_in_time, record.check_out_time)}
                    </Text>
                    {record.is_auto_out && (
                      <Text className="text-xs text-amber-500">자동퇴근</Text>
                    )}
                  </View>
                </View>
                {/* 사고 발생 표시 */}
                {record.has_accident && (
                  <View className="mt-2 px-2 py-1 bg-red-50 rounded">
                    <Text className="text-xs text-red-600">사고 발생</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 하단 여백 */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
