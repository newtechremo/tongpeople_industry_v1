import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSetRecoilState} from 'recoil';
import {CompanyCodeScreenProps} from '@/types/navigation';
import {verifyCompanyCode} from '@/api/auth';
import {
  selectedCompanyState,
  selectedSiteState,
} from '@/store/atoms/companyAtom';
import {isValidCompanyCode} from '@/utils/validators';
import {colors} from '@/constants/colors';
import {ApiError} from '@/types/api';

const CompanyCodeScreen: React.FC<CompanyCodeScreenProps> = ({navigation}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setCompany = useSetRecoilState(selectedCompanyState);
  const setSite = useSetRecoilState(selectedSiteState);

  /**
   * 코드 입력 처리
   */
  const handleCodeChange = useCallback((text: string) => {
    // 영문, 숫자만 허용하고 대문자로 변환
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setCode(cleaned);
    setError('');
  }, []);

  /**
   * 회사코드 검증 및 다음 화면 이동
   */
  const handleNext = useCallback(async () => {
    if (!isValidCompanyCode(code)) {
      setError('4~10자리의 회사코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyCompanyCode(code);

      if (!result.success || !result.company || !result.sites?.length) {
        setError('유효하지 않은 회사코드입니다.');
        return;
      }

      setCompany(result.company);

      // 현장이 1개면 자동 선택 후 전화번호 인증 화면으로 이동
      if (result.sites.length === 1) {
        setSite(result.sites[0]);
        navigation.navigate('PhoneVerify', {
          companyId: result.company.id,
          siteId: result.sites[0].id,
        });
      } else {
        // 현장이 2개 이상이면 현장 선택 화면으로 이동
        navigation.navigate('SiteSelect', {
          companyId: result.company.id,
          companyName: result.company.name,
          sites: result.sites,
        });
      }
    } catch (err) {
      const apiError =
        err instanceof ApiError ? err : new ApiError('UNKNOWN_ERROR');

      if (
        apiError.code === 'COMPANY_NOT_FOUND' ||
        apiError.code === 'INVALID_COMPANY_CODE'
      ) {
        setError('존재하지 않는 회사코드입니다.');
      } else if (apiError.code === 'NETWORK_ERROR') {
        Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
      } else {
        Alert.alert('오류', apiError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [code, navigation, setCompany, setSite]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <Text style={styles.title}>회사코드를 입력해주세요</Text>
          <Text style={styles.subtitle}>
            관리자에게 받은 회사코드를 입력해주세요
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={code}
              onChangeText={handleCodeChange}
              placeholder="ABC123"
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="characters"
              maxLength={10}
              editable={!loading}
              autoFocus
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.button, (!code || loading) && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!code || loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>다음</Text>
            )}
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
    marginBottom: 24,
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
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 8,
    textAlign: 'center',
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

export default CompanyCodeScreen;
