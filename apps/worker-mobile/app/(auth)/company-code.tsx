/**
 * 회사코드 입력 화면
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getCompanyByCode } from '../../src/api/auth';

export default function CompanyCodeScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedCode.length < 4) {
      setError('회사코드는 4자 이상 입력해주세요.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const company = await getCompanyByCode(trimmedCode);

      // 회사 정보와 함께 다음 화면으로 이동
      router.push({
        pathname: '/(auth)/signup',
        params: {
          companyId: company.id.toString(),
          companyName: company.name,
          companyCode: trimmedCode,
        },
      });
    } catch (err: any) {
      setError(err.message || '회사코드 확인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = code.trim().length >= 4;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 안내 영역 */}
          <View className="px-6 pt-8 pb-6">
            <Text className="text-xl font-bold text-slate-800 mb-2">
              회사코드를 입력해주세요
            </Text>
            <Text className="text-slate-500 text-sm leading-5">
              소속 회사의 고유 코드를 입력하면{'\n'}
              해당 회사로 가입이 진행됩니다.
            </Text>
          </View>

          {/* 입력 필드 */}
          <View className="px-6">
            <TextInput
              className={`h-16 px-4 bg-white border rounded-xl text-xl font-bold text-center tracking-widest ${
                error ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="ABCD1234"
              placeholderTextColor="#94A3B8"
              value={code}
              onChangeText={(text) => {
                setCode(text.toUpperCase());
                setError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
            />

            {/* 에러 메시지 */}
            {error ? (
              <Text className="text-red-500 text-sm mt-2">{error}</Text>
            ) : null}

            {/* 힌트 */}
            <View className="mt-4 p-3 bg-slate-50 rounded-xl">
              <Text className="text-slate-500 text-xs">
                * 회사코드를 모르시면 관리자에게 문의해주세요.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View className="p-6 border-t border-slate-100">
          <TouchableOpacity
            className={`h-[52px] rounded-xl items-center justify-center ${
              isValid && !isLoading ? 'bg-orange-500' : 'bg-slate-300'
            }`}
            onPress={handleNext}
            disabled={!isValid || isLoading}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">
              {isLoading ? '확인 중...' : '다음'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
