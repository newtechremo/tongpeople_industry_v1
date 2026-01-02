import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  // 임시 데이터
  const user = {
    name: '홍길동',
    company: '(주)정이앤지',
    site: '경희대학교 학생회관',
  };

  const todayStatus = {
    isCheckedIn: false,
    checkInTime: null as string | null,
    checkOutTime: null as string | null,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-6 py-4">
        {/* 사용자 정보 카드 */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-2xl font-black text-slate-800">{user.name}</Text>
          <Text className="text-base text-slate-500 mt-1">{user.company}</Text>
          <View className="mt-4 pt-4 border-t border-gray-100">
            <Text className="text-sm text-slate-400">현재 현장</Text>
            <Text className="text-base font-bold text-orange-600 mt-1">{user.site}</Text>
          </View>
        </View>

        {/* 오늘 출퇴근 현황 */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-slate-700 mb-4">오늘 출퇴근</Text>
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <Text className="text-sm text-slate-400">출근</Text>
              <Text className="text-xl font-black text-slate-800 mt-1">
                {todayStatus.checkInTime || '--:--'}
              </Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-sm text-slate-400">퇴근</Text>
              <Text className="text-xl font-black text-slate-800 mt-1">
                {todayStatus.checkOutTime || '--:--'}
              </Text>
            </View>
          </View>
        </View>

        {/* QR 출근 버튼 */}
        <Link href="/qr" asChild>
          <TouchableOpacity
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 items-center shadow-lg"
            style={{ backgroundColor: '#F97316' }}
          >
            <Text className="text-white text-xl font-black">출근 QR 보기</Text>
            <Text className="text-orange-100 text-sm mt-2">
              관리자에게 QR을 스캔 받으세요
            </Text>
          </TouchableOpacity>
        </Link>

        {/* 퇴근 버튼 (출근한 경우에만 표시) */}
        {todayStatus.isCheckedIn && !todayStatus.checkOutTime && (
          <TouchableOpacity
            className="mt-4 bg-slate-800 rounded-2xl p-5 items-center"
            onPress={() => alert('퇴근 처리되었습니다.')}
          >
            <Text className="text-white text-lg font-bold">퇴근하기</Text>
          </TouchableOpacity>
        )}

        {/* 하단 네비게이션 */}
        <View className="flex-row justify-center mt-4 space-x-6">
          <Link href="/history" asChild>
            <TouchableOpacity className="py-4 px-4">
              <Text className="text-slate-500 text-base font-medium">출퇴근 기록</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/profile" asChild>
            <TouchableOpacity className="py-4 px-4">
              <Text className="text-slate-500 text-base font-medium">회사 정보</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
