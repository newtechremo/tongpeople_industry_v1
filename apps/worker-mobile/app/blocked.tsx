/**
 * 차단 안내 화면
 *
 * status: BLOCKED
 */
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../src/context/AuthContext';

export default function BlockedScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const handleContact = () => {
    // 관리자 연락처가 있으면 전화 연결
    // Linking.openURL('tel:관리자번호');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1 items-center justify-center px-6">
        {/* 아이콘 */}
        <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-6">
          <Text className="text-5xl">🚫</Text>
        </View>

        {/* 제목 */}
        <Text className="text-2xl font-bold text-slate-800 mb-2 text-center">
          접근이 차단되었습니다
        </Text>

        {/* 설명 */}
        <Text className="text-slate-500 text-center leading-6 mb-8">
          관리자에 의해 서비스 이용이 제한되었습니다.{'\n'}
          자세한 내용은 관리자에게 문의해주세요.
        </Text>

        {/* 사용자 정보 */}
        {user && (
          <View className="w-full p-4 bg-slate-50 rounded-xl mb-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-500">이름</Text>
              <Text className="text-slate-800 font-medium">{user.name}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-500">상태</Text>
              <View className="px-2 py-0.5 bg-red-100 rounded">
                <Text className="text-red-700 text-sm font-medium">차단됨</Text>
              </View>
            </View>
          </View>
        )}

        {/* 경고 */}
        <View className="w-full p-4 bg-red-50 border border-red-200 rounded-xl mb-8">
          <Text className="text-red-700 text-sm text-center">
            차단 해제는 현장 관리자에게 요청해주세요.
          </Text>
        </View>

        {/* 관리자 문의 버튼 */}
        <TouchableOpacity
          className="w-full h-[52px] bg-slate-800 rounded-xl items-center justify-center mb-4"
          onPress={handleContact}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-bold">관리자에게 문의</Text>
        </TouchableOpacity>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity
          className="w-full h-[52px] border border-slate-300 rounded-xl items-center justify-center"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text className="text-slate-600 text-base font-medium">로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
