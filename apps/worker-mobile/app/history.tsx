import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 임시 데이터
const attendanceHistory = [
  { date: '2024-12-21', checkIn: '08:32', checkOut: '17:45', site: '경희대학교 학생회관' },
  { date: '2024-12-20', checkIn: '08:15', checkOut: '18:02', site: '경희대학교 학생회관' },
  { date: '2024-12-19', checkIn: '08:45', checkOut: '17:30', site: '경희대학교 학생회관' },
  { date: '2024-12-18', checkIn: '08:20', checkOut: '17:55', site: '경희대학교 학생회관' },
  { date: '2024-12-17', checkIn: '08:30', checkOut: '18:10', site: '경희대학교 학생회관' },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  return `${month}/${day} (${dayOfWeek})`;
};

export default function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 py-4">
        {/* 이번 달 요약 */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-slate-700 mb-4">12월 근무 현황</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-3xl font-black text-orange-600">15</Text>
              <Text className="text-sm text-slate-400 mt-1">출근일</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-black text-slate-700">120</Text>
              <Text className="text-sm text-slate-400 mt-1">총 근무시간</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-black text-green-600">100%</Text>
              <Text className="text-sm text-slate-400 mt-1">출석률</Text>
            </View>
          </View>
        </View>

        {/* 출퇴근 기록 리스트 */}
        <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
          최근 기록
        </Text>
        <View className="space-y-3">
          {attendanceHistory.map((record, index) => (
            <View
              key={index}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-base font-bold text-slate-700">
                  {formatDate(record.date)}
                </Text>
                <Text className="text-xs text-slate-400">{record.site}</Text>
              </View>
              <View className="flex-row">
                <View className="flex-1">
                  <Text className="text-xs text-slate-400">출근</Text>
                  <Text className="text-lg font-bold text-green-600">{record.checkIn}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-400">퇴근</Text>
                  <Text className="text-lg font-bold text-blue-600">{record.checkOut}</Text>
                </View>
                <View className="flex-1 items-end justify-center">
                  <Text className="text-sm font-bold text-slate-600">
                    {/* 근무시간 계산 (간단히) */}
                    {(() => {
                      const [inH, inM] = record.checkIn.split(':').map(Number);
                      const [outH, outM] = record.checkOut.split(':').map(Number);
                      const hours = outH - inH + (outM - inM) / 60;
                      return `${hours.toFixed(1)}시간`;
                    })()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
