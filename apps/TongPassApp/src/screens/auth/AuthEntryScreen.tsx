/**
 * A00 로그인/가입 선택 화면
 * - 전화번호 + 비밀번호 로그인
 * - 관리자 로그인 체크박스
 * - 가입하기 버튼 → A01
 * - 비밀번호 찾기 → L02 (추후 구현)
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSetRecoilState} from 'recoil';
import {colors} from '@/constants/colors';
import {AuthStackParamList} from '@/types/navigation';
import {formatPhoneNumber} from '@/utils/format';
import {loginWithPassword} from '@/api/auth';
import {useAuth} from '@/hooks/useAuth';
import {workerStatusState, userInfoState} from '@/store/atoms/userAtom';
import {ApiError} from '@/types/api';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const AuthEntryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {login} = useAuth();
  const setWorkerStatus = useSetRecoilState(workerStatusState);
  const setUserInfo = useSetRecoilState(userInfoState);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * 전화번호 입력 처리 (자동 하이픈)
   */
  const handlePhoneChange = useCallback((text: string) => {
    // 숫자만 추출
    const numbersOnly = text.replace(/[^0-9]/g, '');
    // 최대 11자리
    const truncated = numbersOnly.slice(0, 11);
    // 포맷팅
    setPhoneNumber(formatPhoneNumber(truncated));
  }, []);

  /**
   * 로그인 버튼 활성화 조건
   */
  const isLoginEnabled =
    phoneNumber.replace(/-/g, '').length >= 10 && password.length >= 4;

  /**
   * 로그인 처리
   */
  const handleLogin = useCallback(async () => {
    if (!isLoginEnabled) return;

    // 관리자 로그인은 웹에서만 지원
    if (isAdminLogin) {
      Alert.alert(
        '관리자 로그인',
        '관리자 로그인은 웹에서만 지원됩니다.\n관리자 웹사이트를 이용해주세요.',
      );
      return;
    }

    setLoading(true);

    try {
      // 숫자만 추출
      const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');

      // 비밀번호 로그인 API 호출
      const result = await loginWithPassword(cleanedPhone, password);

      // 토큰 저장 및 로그인 처리
      login(result.accessToken, result.refreshToken);

      // 상태 저장
      setWorkerStatus(result.status);

      // 사용자 정보 부분 업데이트 (기존 정보 유지, 로그인 응답 정보로 갱신)
      if (result.workerId) {
        setUserInfo(prev => {
          if (prev) {
            // 기존 정보가 있으면 일부만 업데이트
            return {
              ...prev,
              id: result.workerId,
              phone: cleanedPhone,
              name: result.name || prev.name,
              status: result.status,
            };
          }
          // 기존 정보가 없으면 최소한의 정보로 생성 (전체 정보는 별도 API로 조회 필요)
          return {
            id: result.workerId,
            phone: cleanedPhone,
            phoneNumber: cleanedPhone,
            name: result.name || '',
            birthDate: '',
            isSenior: false,
            gender: 'M' as const,
            nationality: '',
            jobTitle: '',
            status: result.status,
            role: 'WORKER' as const,
            preRegistered: false,
            isDataConflict: false,
            companyId: '',
            siteId: '',
            teamId: '',
            createdAt: new Date().toISOString(),
          };
        });
      }

      // RootNavigator에서 상태에 따라 화면 분기 처리
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');

      if (apiError.code === 'USER_NOT_FOUND') {
        Alert.alert('로그인 실패', '등록되지 않은 전화번호입니다.');
      } else if (apiError.code === 'INVALID_PASSWORD') {
        Alert.alert('로그인 실패', '전화번호 또는 비밀번호가 일치하지 않습니다.');
      } else if (apiError.code === 'WORKER_NOT_ACTIVE') {
        Alert.alert('로그인 실패', '비활성화된 계정입니다.');
      } else if (apiError.code === 'FORBIDDEN') {
        Alert.alert('로그인 실패', '차단된 계정입니다. 관리자에게 문의하세요.');
      } else {
        Alert.alert('로그인 실패', apiError.userMessage || '로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [isLoginEnabled, phoneNumber, password, isAdminLogin, login, setWorkerStatus, setUserInfo]);

  /**
   * 가입하기 버튼 (A01로 이동)
   */
  const handleSignup = useCallback(() => {
    navigation.navigate('CompanyCode');
  }, [navigation]);

  /**
   * 비밀번호 찾기 (L02로 이동)
   */
  const handleForgotPassword = useCallback(() => {
    // TODO: L02 비밀번호 재설정 화면으로 이동
    Alert.alert('준비 중', '비밀번호 재설정 기능은 준비 중입니다.');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* 로고 영역 */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>통</Text>
            </View>
            <Text style={styles.serviceName}>산업현장통</Text>
          </View>

          {/* 환영 메시지 */}
          <Text style={styles.welcomeText}>
            통패스에 오신 것을 환영합니다
          </Text>

          {/* 로그인 입력 섹션 */}
          <View style={styles.inputSection}>
            {/* 전화번호 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>전화번호</Text>
              <TextInput
                style={styles.textInput}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder="010-0000-0000"
                placeholderTextColor={colors.textDisabled}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={13}
              />
            </View>

            {/* 비밀번호 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>비밀번호</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor={colors.textDisabled}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.showPasswordText}>
                    {showPassword ? '숨기기' : '보기'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 관리자 로그인 체크박스 */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsAdminLogin(!isAdminLogin)}>
              <View style={[styles.checkbox, isAdminLogin && styles.checkboxChecked]}>
                {isAdminLogin && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxLabel}>관리자 로그인</Text>
                <Text style={styles.checkboxHint}>
                  관리자 계정으로 로그인할 때 선택하세요.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              !isLoginEnabled && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!isLoginEnabled || loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>기존 계정 로그인</Text>
            )}
          </TouchableOpacity>

          {/* 비밀번호 찾기 */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>
              비밀번호를 잊으셨나요?
            </Text>
          </TouchableOpacity>

          {/* 가입하기 버튼 */}
          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignup}
            activeOpacity={0.8}>
            <Text style={styles.signupButtonText}>
              처음이신가요? 가입하기
            </Text>
          </TouchableOpacity>

          {/* 안내 텍스트 */}
          <Text style={styles.helpText}>
            회사코드가 없으면 관리자에게 문의해주세요
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  // 로고 영역
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.background,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  // 환영 메시지
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
  },
  // 입력 섹션
  inputSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 70,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showPasswordText: {
    fontSize: 14,
    color: colors.primary,
  },
  // 체크박스
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  checkboxHint: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  // 로그인 버튼
  loginButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.background,
  },
  // 비밀번호 찾기
  forgotPasswordButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
  },
  // 가입하기 버튼
  signupButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signupButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  // 안내 텍스트
  helpText: {
    fontSize: 13,
    color: colors.textDisabled,
    textAlign: 'center',
  },
});

export default AuthEntryScreen;
