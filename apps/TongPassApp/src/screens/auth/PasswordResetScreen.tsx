/**
 * L02 비밀번호 재설정 화면
 * - 전화번호 입력 → SMS 인증 → 새 비밀번호 설정
 * - 단계별 진행 UI
 */

import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {colors} from '@/constants/colors';
import {AuthStackParamList} from '@/types/navigation';
import {requestSmsCodeForReset, verifySmsForReset, resetPassword} from '@/api/auth';
import {useSmsTimer} from '@/hooks/useTimer';
import {ApiError} from '@/types/api';
import {isValidPhoneNumber} from '@/utils/validators';
import {formatPhoneNumber} from '@/utils/format';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// 단계 정의
type Step = 'phone' | 'verify' | 'password';

// 비밀번호 규칙
interface PasswordRule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  {id: 'length', label: '8자 이상', test: pw => pw.length >= 8},
  {id: 'letter', label: '영문 포함', test: pw => /[a-zA-Z]/.test(pw)},
  {id: 'number', label: '숫자 포함', test: pw => /[0-9]/.test(pw)},
  {
    id: 'special',
    label: '특수문자 포함',
    test: pw => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  },
];

const PasswordResetScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // 단계 상태
  const [step, setStep] = useState<Step>('phone');

  // 입력 상태
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 타이머
  const timer = useSmsTimer(() => {
    Alert.alert('알림', '인증번호가 만료되었습니다. 다시 요청해주세요.');
    setStep('phone');
  });

  // refs
  const codeInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmInputRef = useRef<TextInput>(null);

  /**
   * 전화번호 입력 처리
   */
  const handlePhoneChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    setPhoneError('');
  }, []);

  /**
   * 인증번호 입력 처리
   */
  const handleCodeChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setVerifyCode(cleaned);
    setCodeError('');
  }, []);

  /**
   * 인증번호 요청
   */
  const handleSendCode = useCallback(async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      setPhoneError('올바른 전화번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setPhoneError('');

    try {
      await requestSmsCodeForReset(phoneNumber);
      setStep('verify');
      timer.restart();
      Alert.alert('알림', '인증번호가 전송되었습니다.');
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');

      if (apiError.code === 'USER_NOT_FOUND') {
        setPhoneError('등록되지 않은 전화번호입니다.');
      } else if (apiError.code === 'TOO_MANY_REQUESTS') {
        Alert.alert('알림', '잠시 후 다시 시도해주세요.');
      } else {
        Alert.alert('오류', apiError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, timer]);

  /**
   * 인증번호 재전송
   */
  const handleResendCode = useCallback(async () => {
    setVerifyCode('');
    setCodeError('');

    setLoading(true);

    try {
      await requestSmsCodeForReset(phoneNumber);
      timer.restart();
      Alert.alert('알림', '인증번호가 재전송되었습니다.');
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');
      Alert.alert('오류', apiError.userMessage);
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, timer]);

  /**
   * 인증번호 확인
   */
  const handleVerifyCode = useCallback(async () => {
    if (verifyCode.length !== 6) {
      setCodeError('6자리 인증번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setCodeError('');

    try {
      const response = await verifySmsForReset(phoneNumber, verifyCode);
      setVerificationToken(response.verificationToken);
      setStep('password');
      timer.pause();
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');

      if (apiError.code === 'INVALID_CODE') {
        setCodeError('인증번호가 일치하지 않습니다.');
      } else if (apiError.code === 'CODE_EXPIRED') {
        setCodeError('인증번호가 만료되었습니다.');
      } else {
        Alert.alert('오류', apiError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, verifyCode, timer]);

  /**
   * 비밀번호 유효성 검사
   */
  const isPasswordValid = useCallback(() => {
    return PASSWORD_RULES.every(rule => rule.test(password));
  }, [password]);

  /**
   * 비밀번호 일치 검사
   */
  const isPasswordMatch = useCallback(() => {
    return password === confirmPassword && confirmPassword.length > 0;
  }, [password, confirmPassword]);

  /**
   * 비밀번호 재설정 완료
   */
  const handleResetPassword = useCallback(async () => {
    if (!isPasswordValid()) {
      setPasswordError('비밀번호 조건을 모두 충족해주세요.');
      return;
    }

    if (!isPasswordMatch()) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    setPasswordError('');

    try {
      await resetPassword(verificationToken, password);
      Alert.alert(
        '비밀번호 변경 완료',
        '비밀번호가 성공적으로 변경되었습니다.\n새 비밀번호로 로그인해주세요.',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');
      Alert.alert('오류', apiError.userMessage);
    } finally {
      setLoading(false);
    }
  }, [verificationToken, password, isPasswordValid, isPasswordMatch, navigation]);

  /**
   * 타이머 포맷
   */
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  /**
   * 단계별 진행 표시
   */
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, step !== 'phone' && styles.stepDotCompleted]}>
        {step !== 'phone' ? (
          <Text style={styles.stepCheck}>✓</Text>
        ) : (
          <Text style={styles.stepNumber}>1</Text>
        )}
      </View>
      <View style={[styles.stepLine, step !== 'phone' && styles.stepLineCompleted]} />
      <View
        style={[
          styles.stepDot,
          step === 'password' && styles.stepDotCompleted,
          step === 'verify' && styles.stepDotActive,
        ]}>
        {step === 'password' ? (
          <Text style={styles.stepCheck}>✓</Text>
        ) : (
          <Text style={[styles.stepNumber, step === 'verify' && styles.stepNumberActive]}>
            2
          </Text>
        )}
      </View>
      <View style={[styles.stepLine, step === 'password' && styles.stepLineCompleted]} />
      <View style={[styles.stepDot, step === 'password' && styles.stepDotActive]}>
        <Text style={[styles.stepNumber, step === 'password' && styles.stepNumberActive]}>
          3
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* 단계 표시 */}
          {renderStepIndicator()}

          {/* Step 1: 전화번호 입력 */}
          {step === 'phone' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>비밀번호 재설정</Text>
              <Text style={styles.subtitle}>
                가입 시 등록한 전화번호를 입력해주세요.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>전화번호</Text>
                <TextInput
                  style={[styles.input, phoneError ? styles.inputError : undefined]}
                  placeholder="01012345678"
                  placeholderTextColor={colors.textDisabled}
                  value={formatPhoneNumber(phoneNumber)}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={13}
                  editable={!loading}
                />
                {phoneError ? (
                  <Text style={styles.errorText}>{phoneError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!phoneNumber || loading) && styles.buttonDisabled,
                ]}
                onPress={handleSendCode}
                disabled={!phoneNumber || loading}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>인증번호 받기</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: 인증번호 입력 */}
          {step === 'verify' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>인증번호 입력</Text>
              <Text style={styles.subtitle}>
                {formatPhoneNumber(phoneNumber)}로{'\n'}전송된 인증번호를 입력해주세요.
              </Text>

              <View style={styles.inputContainer}>
                <View style={styles.codeInputRow}>
                  <TextInput
                    ref={codeInputRef}
                    style={[styles.input, styles.codeInput, codeError ? styles.inputError : undefined]}
                    placeholder="인증번호 6자리"
                    placeholderTextColor={colors.textDisabled}
                    value={verifyCode}
                    onChangeText={handleCodeChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                  />
                  <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>{formatTime(timer.remaining)}</Text>
                  </View>
                </View>
                {codeError ? (
                  <Text style={styles.errorText}>{codeError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={loading}>
                <Text style={styles.resendButtonText}>인증번호 재전송</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (verifyCode.length !== 6 || loading) && styles.buttonDisabled,
                ]}
                onPress={handleVerifyCode}
                disabled={verifyCode.length !== 6 || loading}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>확인</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: 새 비밀번호 설정 */}
          {step === 'password' && (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>새 비밀번호 설정</Text>
              <Text style={styles.subtitle}>
                새로운 비밀번호를 입력해주세요.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>새 비밀번호</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    ref={passwordInputRef}
                    style={[styles.input, styles.passwordInput]}
                    placeholder="비밀번호 입력"
                    placeholderTextColor={colors.textDisabled}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmInputRef.current?.focus()}
                  />
                  <TouchableOpacity
                    style={styles.showPasswordButton}
                    onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.showPasswordText}>
                      {showPassword ? '숨김' : '표시'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 비밀번호 규칙 */}
                <View style={styles.rulesContainer}>
                  {PASSWORD_RULES.map(rule => {
                    const passed = rule.test(password);
                    return (
                      <View key={rule.id} style={styles.ruleItem}>
                        <Text
                          style={[
                            styles.ruleIcon,
                            passed ? styles.ruleIconPassed : styles.ruleIconFailed,
                          ]}>
                          {passed ? '✓' : '○'}
                        </Text>
                        <Text
                          style={[
                            styles.ruleText,
                            passed ? styles.ruleTextPassed : styles.ruleTextFailed,
                          ]}>
                          {rule.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>비밀번호 확인</Text>
                <TextInput
                  ref={confirmInputRef}
                  style={[
                    styles.input,
                    confirmPassword.length > 0 &&
                      !isPasswordMatch() &&
                      styles.inputError,
                  ]}
                  placeholder="비밀번호 재입력"
                  placeholderTextColor={colors.textDisabled}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
                {confirmPassword.length > 0 && !isPasswordMatch() && (
                  <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
                )}
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!isPasswordValid() || !isPasswordMatch() || loading) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={!isPasswordValid() || !isPasswordMatch() || loading}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>비밀번호 변경</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  // 단계 표시
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundGray,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDisabled,
  },
  stepNumberActive: {
    color: colors.primary,
  },
  stepCheck: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
  },
  stepLineCompleted: {
    backgroundColor: colors.primary,
  },
  // 단계 컨테이너
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
  },
  // 입력
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
  // 인증번호 입력
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerContainer: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  resendButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  // 비밀번호 입력
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 60,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 16,
    paddingVertical: 8,
  },
  showPasswordText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // 비밀번호 규칙
  rulesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ruleIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  ruleIconPassed: {
    color: colors.success,
  },
  ruleIconFailed: {
    color: colors.textDisabled,
  },
  ruleText: {
    fontSize: 12,
  },
  ruleTextPassed: {
    color: colors.success,
  },
  ruleTextFailed: {
    color: colors.textSecondary,
  },
  // 버튼
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default PasswordResetScreen;
