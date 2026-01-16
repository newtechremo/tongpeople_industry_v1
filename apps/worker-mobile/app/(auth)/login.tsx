/**
 * 로그인 화면
 */
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!phone.trim()) {
      setError('휴대폰 번호를 입력해주세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setError('');

    try {
      await signIn(phone.replace(/-/g, ''), password);
      // 로그인 성공 시 AuthContext가 자동으로 상태 업데이트
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/company-code');
  };

  // 전화번호 포맷팅
  const formatPhone = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 로고 영역 */}
          <View className="items-center pt-16 pb-12">
            <View className="w-24 h-24 bg-orange-500 rounded-3xl items-center justify-center mb-4">
              <Text className="text-white text-4xl font-bold">통</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-800">산업현장통</Text>
            <Text className="text-slate-500 mt-1">QR 출퇴근 관리 서비스</Text>
          </View>

          {/* 입력 폼 */}
          <View className="px-6">
            {/* 휴대폰 번호 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                휴대폰 번호
              </Text>
              <TextInput
                className="h-[52px] px-4 bg-white border border-slate-300 rounded-xl text-base text-slate-800"
                placeholder="010-0000-0000"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                keyboardType="phone-pad"
                maxLength={13}
                autoComplete="tel"
              />
            </View>

            {/* 비밀번호 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                비밀번호
              </Text>
              <TextInput
                className="h-[52px] px-4 bg-white border border-slate-300 rounded-xl text-base text-slate-800"
                placeholder="비밀번호를 입력해주세요"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            {/* 에러 메시지 */}
            {error ? (
              <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* 로그인 버튼 */}
            <TouchableOpacity
              className={`h-[52px] rounded-xl items-center justify-center ${
                isLoading ? 'bg-slate-300' : 'bg-orange-500'
              }`}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-bold">
                {isLoading ? '로그인 중...' : '로그인'}
              </Text>
            </TouchableOpacity>

            {/* 구분선 */}
            <View className="flex-row items-center my-8">
              <View className="flex-1 h-[1px] bg-slate-200" />
              <Text className="mx-4 text-slate-400 text-sm">또는</Text>
              <View className="flex-1 h-[1px] bg-slate-200" />
            </View>

            {/* 회원가입 버튼 */}
            <TouchableOpacity
              className="h-[52px] rounded-xl items-center justify-center border border-orange-500"
              onPress={handleSignUp}
              activeOpacity={0.8}
            >
              <Text className="text-orange-500 text-base font-bold">
                회원가입
              </Text>
            </TouchableOpacity>
          </View>

          {/* 하단 안내 */}
          <View className="mt-auto p-6">
            <Text className="text-center text-slate-400 text-xs">
              회원가입 시 관리자 승인이 필요합니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
