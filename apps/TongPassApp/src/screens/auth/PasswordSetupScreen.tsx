/**
 * A09 비밀번호 설정 화면
 * - 비밀번호 + 확인 입력
 * - 실시간 유효성 검사 (8자+, 영문/숫자/특수문자)
 * - 다음 → A05 정보 입력
 */

import React, {useState, useCallback, useMemo} from 'react';
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
} from 'react-native';
import {PasswordSetupScreenProps} from '@/types/navigation';
import {colors} from '@/constants/colors';

// 비밀번호 유효성 검사 규칙
interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: '8자 이상',
    test: (pw) => pw.length >= 8,
  },
  {
    id: 'letter',
    label: '영문 포함',
    test: (pw) => /[a-zA-Z]/.test(pw),
  },
  {
    id: 'number',
    label: '숫자 포함',
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    id: 'special',
    label: '특수문자 포함',
    test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  },
];

const PasswordSetupScreen: React.FC<PasswordSetupScreenProps> = ({
  navigation,
  route,
}) => {
  const {companyId, siteId, phoneNumber, preRegisteredData} = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * 비밀번호 규칙 검사 결과
   */
  const ruleResults = useMemo(() => {
    return PASSWORD_RULES.map(rule => ({
      ...rule,
      passed: rule.test(password),
    }));
  }, [password]);

  /**
   * 모든 규칙 통과 여부
   */
  const allRulesPassed = useMemo(() => {
    return ruleResults.every(rule => rule.passed);
  }, [ruleResults]);

  /**
   * 비밀번호 일치 여부
   */
  const passwordsMatch = useMemo(() => {
    return password.length > 0 && password === confirmPassword;
  }, [password, confirmPassword]);

  /**
   * 다음 버튼 활성화 조건
   */
  const isNextEnabled = allRulesPassed && passwordsMatch;

  /**
   * 다음 버튼 처리 (A05 정보 입력으로 이동)
   */
  const handleNext = useCallback(() => {
    if (!isNextEnabled) return;

    // A05 정보 입력 화면으로 이동
    navigation.navigate('WorkerInfo', {
      companyId,
      siteId,
      phoneNumber,
      preRegisteredData,
      // TODO: 비밀번호는 최종 등록 시 사용
      // password는 WorkerRegistrationData에 추가 필요
    });
  }, [isNextEnabled, navigation, companyId, siteId, phoneNumber, preRegisteredData]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* 안내 텍스트 */}
          <View style={styles.header}>
            <Text style={styles.title}>비밀번호 설정</Text>
            <Text style={styles.subtitle}>
              로그인에 사용할 비밀번호를 설정해주세요
            </Text>
          </View>

          {/* 비밀번호 입력 */}
          <View style={styles.inputSection}>
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
                  autoCapitalize="none"
                  autoCorrect={false}
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

            {/* 비밀번호 규칙 표시 */}
            <View style={styles.rulesContainer}>
              {ruleResults.map(rule => (
                <View key={rule.id} style={styles.ruleItem}>
                  <View
                    style={[
                      styles.ruleIcon,
                      rule.passed && styles.ruleIconPassed,
                    ]}>
                    <Text
                      style={[
                        styles.ruleIconText,
                        rule.passed && styles.ruleIconTextPassed,
                      ]}>
                      {rule.passed ? '✓' : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.ruleText,
                      rule.passed && styles.ruleTextPassed,
                    ]}>
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* 비밀번호 확인 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>비밀번호 확인</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.passwordInput,
                    confirmPassword.length > 0 &&
                      !passwordsMatch &&
                      styles.textInputError,
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="비밀번호를 다시 입력하세요"
                  placeholderTextColor={colors.textDisabled}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Text style={styles.showPasswordText}>
                    {showConfirmPassword ? '숨기기' : '보기'}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* 불일치 에러 메시지 */}
              {confirmPassword.length > 0 && !passwordsMatch && (
                <Text style={styles.errorText}>
                  비밀번호가 일치하지 않습니다
                </Text>
              )}
              {/* 일치 메시지 */}
              {passwordsMatch && (
                <Text style={styles.successText}>비밀번호가 일치합니다</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !isNextEnabled && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!isNextEnabled}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>다음</Text>
          </TouchableOpacity>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  inputSection: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
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
  textInputError: {
    borderColor: colors.error,
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
  // 비밀번호 규칙
  rulesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleIconPassed: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  ruleIconText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textDisabled,
  },
  ruleIconTextPassed: {
    color: colors.background,
  },
  ruleText: {
    fontSize: 13,
    color: colors.textDisabled,
  },
  ruleTextPassed: {
    color: colors.success,
  },
  // 에러/성공 메시지
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: 4,
  },
  successText: {
    fontSize: 13,
    color: colors.success,
    marginTop: 4,
  },
  // 하단 버튼
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PasswordSetupScreen;
