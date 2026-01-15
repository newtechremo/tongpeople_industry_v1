/**
 * 승인 대기 화면
 *
 * status: PENDING (선등록 동의 대기) 또는 REQUESTED (승인 대기)
 */
import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../src/context/AuthContext';

export default function PendingScreen() {
  const { user, status, signOut, refreshProfile } = useAuth();

  // 5초마다 상태 확인
  useEffect(() => {
    const interval = setInterval(() => {
      refreshProfile();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshProfile]);

  const handleLogout = async () => {
    await signOut();
  };

  const isPending = status === 'PENDING';
  const isRequested = status === 'REQUESTED';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1 items-center justify-center px-6">
        {/* 아이콘 */}
        <View className="w-24 h-24 bg-amber-100 rounded-full items-center justify-center mb-6">
          <Text className="text-5xl">⏳</Text>
        </View>

        {/* 제목 */}
        <Text className="text-2xl font-bold text-slate-800 mb-2 text-center">
          {isPending ? '동의가 필요합니다' : '승인 대기 중'}
        </Text>

        {/* 설명 */}
        <Text className="text-slate-500 text-center leading-6 mb-8">
          {isPending
            ? '관리자가 등록한 정보입니다.\n서비스 이용에 동의해주세요.'
            : '가입 신청이 완료되었습니다.\n관리자 승인 후 서비스를 이용할 수 있습니다.'}
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
              <View className="px-2 py-0.5 bg-amber-100 rounded">
                <Text className="text-amber-700 text-sm font-medium">
                  {isPending ? '동의 대기' : '승인 대기'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 안내 */}
        <View className="w-full p-4 bg-blue-50 border border-blue-200 rounded-xl mb-8">
          <Text className="text-blue-700 text-sm text-center">
            {isPending
              ? '동의 버튼을 누르면 즉시 서비스를 이용할 수 있습니다.'
              : '승인이 완료되면 자동으로 화면이 전환됩니다.'}
          </Text>
        </View>

        {/* 동의 버튼 (PENDING 상태에서만 표시) */}
        {isPending && (
          <TouchableOpacity
            className="w-full h-[52px] bg-orange-500 rounded-xl items-center justify-center mb-4"
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">동의하고 시작하기</Text>
          </TouchableOpacity>
        )}

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
