/**
 * 전화번호 인증 화면
 * - SMS 인증번호 요청
 * - 인증번호 확인
 * - 기존 회원/신규 회원 분기
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useSetRecoilState} from 'recoil';
import {PhoneVerifyScreenProps} from '@/types/navigation';
import {colors} from '@/constants/colors';
import {requestSmsCode, verifySms} from '@/api/auth';
import {useSmsTimer} from '@/hooks/useTimer';
import {useAuth} from '@/hooks/useAuth';
import {workerStatusState} from '@/store/atoms/userAtom';
import {ApiError} from '@/types/api';
import {isValidPhoneNumber} from '@/utils/validators';
import {formatPhoneNumber} from '@/utils/format';

const PhoneVerifyScreen: React.FC<PhoneVerifyScreenProps> = ({
  navigation,
  route,
}) => {
  const {companyId, siteId} = route.params;
  const {login} = useAuth();
  const setWorkerStatus = useSetRecoilState(workerStatusState);

  // 상태
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');

  // 타이머
  const timer = useSmsTimer(() => {
    Alert.alert('알림', '인증번호가 만료되었습니다. 다시 요청해주세요.');
  });

  /**
   * 전화번호 입력 처리
   */
  const handlePhoneChange = useCallback((text: string) => {
    // 숫자만 허용
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    setPhoneError('');
  }, []);

  /**
   * 인증번호 입력 처리
   */
  const handleCodeChange = useCallback((text: string) => {
    // 숫자만 허용, 6자리 제한
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setVerifyCode(cleaned);
    setCodeError('');
  }, []);

  /**
   * 인증번호 요청
   */
  const handleSendCode = useCallback(async () => {
    // 유효성 검사
    if (!isValidPhoneNumber(phoneNumber)) {
      setPhoneError('올바른 전화번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setPhoneError('');

    try {
      await requestSmsCode(phoneNumber);
      setIsCodeSent(true);
      timer.restart();
      Alert.alert('알림', '인증번호가 전송되었습니다.');
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');

      if (apiError.code === 'TOO_MANY_REQUESTS') {
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
    await handleSendCode();
  }, [handleSendCode]);

  /**
   * 인증 확인
   */
  const handleVerify = useCallback(async () => {
    // 유효성 검사
    if (verifyCode.length !== 6) {
      setCodeError('6자리 인증번호를 입력해주세요.');
      return;
    }

    if (timer.isComplete) {
      Alert.alert('알림', '인증번호가 만료되었습니다. 다시 요청해주세요.');
      return;
    }

    setLoading(true);
    setCodeError('');

    try {
      const result = await verifySms(phoneNumber, verifyCode);
      timer.pause();

      // 기존 회원인 경우
      if (result.isRegistered && result.accessToken && result.refreshToken) {
        login(result.accessToken, result.refreshToken);

        if (result.status) {
          setWorkerStatus(result.status);
        }

        // 상태에 따라 화면 분기는 RootNavigator에서 처리
        return;
      }

      // 신규 회원 또는 선등록 회원
      navigation.navigate('WorkerInfo', {
        companyId,
        siteId,
        phoneNumber,
        preRegisteredData: result.preRegisteredData,
      });
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');

      if (apiError.code === 'INVALID_CODE') {
        setCodeError('인증번호가 일치하지 않습니다.');
      } else if (apiError.code === 'CODE_EXPIRED') {
        Alert.alert('알림', '인증번호가 만료되었습니다. 다시 요청해주세요.');
        timer.reset();
        setIsCodeSent(false);
        setVerifyCode('');
      } else {
        Alert.alert('오류', apiError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [
    phoneNumber,
    verifyCode,
    timer,
    companyId,
    siteId,
    navigation,
    login,
    setWorkerStatus,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <Text style={styles.title}>전화번호 인증</Text>
          <Text style={styles.subtitle}>
            본인 확인을 위해 전화번호를 입력해주세요
          </Text>

          {/* 전화번호 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>전화번호</Text>
            <TextInput
              style={[
                styles.input,
                phoneError ? styles.inputError : null,
                isCodeSent ? styles.inputDisabled : null,
              ]}
              value={formatPhoneNumber(phoneNumber)}
              onChangeText={handlePhoneChange}
              placeholder="010-1234-5678"
              placeholderTextColor={colors.textDisabled}
              keyboardType="phone-pad"
              maxLength={13}
              editable={!isCodeSent && !loading}
            />
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}
          </View>

          {!isCodeSent ? (
            // 인증번호 요청 버튼
            <TouchableOpacity
              style={[
                styles.button,
                (!phoneNumber || loading) && styles.buttonDisabled,
              ]}
              onPress={handleSendCode}
              disabled={!phoneNumber || loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>인증번호 받기</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {/* 인증번호 입력 */}
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>인증번호</Text>
                  <Text
                    style={[
                      styles.timerText,
                      timer.remaining < 60 && styles.timerWarning,
                    ]}>
                    {timer.formatted}
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, codeError ? styles.inputError : null]}
                  value={verifyCode}
                  onChangeText={handleCodeChange}
                  placeholder="6자리 숫자"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                  autoFocus
                />
                {codeError ? (
                  <Text style={styles.errorText}>{codeError}</Text>
                ) : null}
              </View>

              {/* 재전송 링크 */}
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={loading}>
                <Text style={styles.resendText}>인증번호 다시 받기</Text>
              </TouchableOpacity>

              {/* 확인 버튼 */}
              <TouchableOpacity
                style={[
                  styles.button,
                  (verifyCode.length !== 6 || loading) && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={verifyCode.length !== 6 || loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>다음</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* 전화번호 변경 */}
          {isCodeSent && (
            <TouchableOpacity
              style={styles.changePhoneButton}
              onPress={() => {
                timer.reset();
                setIsCodeSent(false);
                setVerifyCode('');
                setPhoneNumber('');
              }}
              disabled={loading}>
              <Text style={styles.changePhoneText}>전화번호 다시 입력</Text>
            </TouchableOpacity>
          )}
        </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.backgroundGray,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  timerWarning: {
    color: colors.error,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  changePhoneButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  changePhoneText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default PhoneVerifyScreen;
