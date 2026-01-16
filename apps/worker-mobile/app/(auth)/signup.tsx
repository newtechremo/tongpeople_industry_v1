/**
 * 회원가입 정보 입력 화면
 */
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { signUp, getSitesByCompany, getTeamsBySite, type SignUpData } from '../../src/api/auth';

type Site = { id: number; name: string };
type Team = { id: number; name: string };

export default function SignUpScreen() {
  const params = useLocalSearchParams<{
    companyId: string;
    companyName: string;
    companyCode: string;
  }>();

  const companyId = Number(params.companyId);
  const companyName = params.companyName || '';

  // 폼 상태
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [nationality, setNationality] = useState('대한민국');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // 선택 목록
  const [sites, setSites] = useState<Site[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showSitePicker, setShowSitePicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  // 상태
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 현장 목록 조회
  useEffect(() => {
    if (companyId) {
      getSitesByCompany(companyId)
        .then(setSites)
        .catch((err) => console.error('현장 조회 실패:', err));
    }
  }, [companyId]);

  // 팀 목록 조회 (현장 선택 시)
  useEffect(() => {
    if (selectedSite) {
      setSelectedTeam(null);
      getTeamsBySite(selectedSite.id)
        .then(setTeams)
        .catch((err) => console.error('팀 조회 실패:', err));
    }
  }, [selectedSite]);

  // 생년월일 포맷팅 (YYYYMMDD → YYYY-MM-DD)
  const formatBirthDate = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    return numbers.slice(0, 8);
  };

  // 전화번호 포맷팅
  const formatPhone = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = '이름은 2자 이상 입력해주세요.';
    }
    if (birthDate.length !== 8) {
      newErrors.birthDate = '생년월일 8자리를 입력해주세요.';
    }
    if (phone.replace(/-/g, '').length !== 11) {
      newErrors.phone = '휴대폰 번호 11자리를 입력해주세요.';
    }
    if (password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상 입력해주세요.';
    }
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }
    if (!selectedSite) {
      newErrors.site = '소속 현장을 선택해주세요.';
    }
    if (!selectedTeam) {
      newErrors.team = '소속 팀을 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 회원가입 처리
  const handleSignUp = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      // 생년월일 포맷 변환 (YYYYMMDD → YYYY-MM-DD)
      const formattedBirthDate = `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`;

      const data: SignUpData = {
        phone: phone.replace(/-/g, ''),
        password,
        name: name.trim(),
        birthDate: formattedBirthDate,
        gender,
        nationality,
        companyId,
        siteId: selectedSite!.id,
        teamId: selectedTeam!.id,
      };

      await signUp(data);

      Alert.alert(
        '가입 완료',
        '회원가입이 완료되었습니다.\n관리자 승인 후 서비스를 이용할 수 있습니다.',
        [{ text: '확인', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      Alert.alert('가입 실패', err.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid =
    name.trim().length >= 2 &&
    birthDate.length === 8 &&
    phone.replace(/-/g, '').length === 11 &&
    password.length >= 6 &&
    password === passwordConfirm &&
    selectedSite &&
    selectedTeam;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 회사 정보 배너 */}
          <View className="mx-4 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <Text className="text-orange-700 text-sm font-medium">
              {companyName}에 가입합니다
            </Text>
          </View>

          {/* 폼 */}
          <View className="p-4">
            {/* 이름 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                이름 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`h-[52px] px-4 bg-white border rounded-xl text-base ${
                  errors.name ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="이름을 입력해주세요"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
              {errors.name && (
                <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
              )}
            </View>

            {/* 생년월일 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                생년월일 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`h-[52px] px-4 bg-white border rounded-xl text-base ${
                  errors.birthDate ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="예: 19850315"
                placeholderTextColor="#94A3B8"
                value={birthDate}
                onChangeText={(text) => setBirthDate(formatBirthDate(text))}
                keyboardType="number-pad"
                maxLength={8}
              />
              <Text className="text-slate-400 text-xs mt-1">
                예: 1985년 3월 15일 → 19850315
              </Text>
              {errors.birthDate && (
                <Text className="text-red-500 text-xs mt-1">{errors.birthDate}</Text>
              )}
            </View>

            {/* 휴대폰 번호 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                휴대폰 번호 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`h-[52px] px-4 bg-white border rounded-xl text-base ${
                  errors.phone ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="010-0000-0000"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                keyboardType="phone-pad"
                maxLength={13}
              />
              {errors.phone && (
                <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>
              )}
            </View>

            {/* 비밀번호 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                비밀번호 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`h-[52px] px-4 bg-white border rounded-xl text-base ${
                  errors.password ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="6자 이상 입력해주세요"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {errors.password && (
                <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
              )}
            </View>

            {/* 비밀번호 확인 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                비밀번호 확인 <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`h-[52px] px-4 bg-white border rounded-xl text-base ${
                  errors.passwordConfirm ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="비밀번호를 다시 입력해주세요"
                placeholderTextColor="#94A3B8"
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secureTextEntry
              />
              {errors.passwordConfirm && (
                <Text className="text-red-500 text-xs mt-1">{errors.passwordConfirm}</Text>
              )}
            </View>

            {/* 성별 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                성별 <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  className={`flex-1 h-[52px] mr-2 rounded-xl items-center justify-center border ${
                    gender === 'M'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-300 bg-white'
                  }`}
                  onPress={() => setGender('M')}
                >
                  <Text
                    className={gender === 'M' ? 'text-orange-600 font-bold' : 'text-slate-600'}
                  >
                    남성
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 h-[52px] ml-2 rounded-xl items-center justify-center border ${
                    gender === 'F'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-300 bg-white'
                  }`}
                  onPress={() => setGender('F')}
                >
                  <Text
                    className={gender === 'F' ? 'text-orange-600 font-bold' : 'text-slate-600'}
                  >
                    여성
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 국적 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">국적</Text>
              <TextInput
                className="h-[52px] px-4 bg-white border border-slate-300 rounded-xl text-base"
                placeholder="국적을 입력해주세요"
                placeholderTextColor="#94A3B8"
                value={nationality}
                onChangeText={setNationality}
              />
            </View>

            {/* 소속 현장 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                소속 현장 <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                className={`h-[52px] px-4 bg-white border rounded-xl justify-center ${
                  errors.site ? 'border-red-500' : 'border-slate-300'
                }`}
                onPress={() => setShowSitePicker(!showSitePicker)}
              >
                <Text className={selectedSite ? 'text-slate-800' : 'text-slate-400'}>
                  {selectedSite?.name || '현장을 선택해주세요'}
                </Text>
              </TouchableOpacity>
              {showSitePicker && (
                <View className="mt-2 border border-slate-200 rounded-xl overflow-hidden">
                  {sites.map((site) => (
                    <TouchableOpacity
                      key={site.id}
                      className={`p-3 border-b border-slate-100 ${
                        selectedSite?.id === site.id ? 'bg-orange-50' : 'bg-white'
                      }`}
                      onPress={() => {
                        setSelectedSite(site);
                        setShowSitePicker(false);
                      }}
                    >
                      <Text
                        className={
                          selectedSite?.id === site.id ? 'text-orange-600 font-medium' : 'text-slate-700'
                        }
                      >
                        {site.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.site && (
                <Text className="text-red-500 text-xs mt-1">{errors.site}</Text>
              )}
            </View>

            {/* 소속 팀 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-600 mb-2">
                소속 팀 <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                className={`h-[52px] px-4 bg-white border rounded-xl justify-center ${
                  errors.team ? 'border-red-500' : !selectedSite ? 'border-slate-200 bg-slate-50' : 'border-slate-300'
                }`}
                onPress={() => selectedSite && setShowTeamPicker(!showTeamPicker)}
                disabled={!selectedSite}
              >
                <Text className={selectedTeam ? 'text-slate-800' : 'text-slate-400'}>
                  {selectedTeam?.name || (selectedSite ? '팀을 선택해주세요' : '현장을 먼저 선택해주세요')}
                </Text>
              </TouchableOpacity>
              {showTeamPicker && teams.length > 0 && (
                <View className="mt-2 border border-slate-200 rounded-xl overflow-hidden">
                  {teams.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      className={`p-3 border-b border-slate-100 ${
                        selectedTeam?.id === team.id ? 'bg-orange-50' : 'bg-white'
                      }`}
                      onPress={() => {
                        setSelectedTeam(team);
                        setShowTeamPicker(false);
                      }}
                    >
                      <Text
                        className={
                          selectedTeam?.id === team.id ? 'text-orange-600 font-medium' : 'text-slate-700'
                        }
                      >
                        {team.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.team && (
                <Text className="text-red-500 text-xs mt-1">{errors.team}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100">
          <TouchableOpacity
            className={`h-[52px] rounded-xl items-center justify-center ${
              isValid && !isLoading ? 'bg-orange-500' : 'bg-slate-300'
            }`}
            onPress={handleSignUp}
            disabled={!isValid || isLoading}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">
              {isLoading ? '가입 중...' : '회원가입'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
