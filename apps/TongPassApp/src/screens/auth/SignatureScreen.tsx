/**
 * 전자서명 화면
 * - 서명 캔버스
 * - 서명 확인 및 지우기
 * - 가입 요청 API 호출
 */

import React, {useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import {useSetRecoilState} from 'recoil';
import {SignatureScreenProps} from '@/types/navigation';
import {colors} from '@/constants/colors';
import {registerWorker} from '@/api/auth';
import {ApiError} from '@/types/api';
import {useAuth} from '@/hooks/useAuth';
import {workerStatusState, userInfoState} from '@/store/atoms/userAtom';

const SignatureScreenComponent: React.FC<SignatureScreenProps> = ({
  navigation,
  route,
}) => {
  const {registrationData, agreedTerms} = route.params;
  const {login} = useAuth();
  const setWorkerStatus = useSetRecoilState(workerStatusState);
  const setUserInfo = useSetRecoilState(userInfoState);

  const signatureRef = useRef<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * 서명 지우기
   */
  const handleClear = useCallback(() => {
    signatureRef.current?.clearSignature();
    setSignature(null);
  }, []);

  /**
   * 서명 확인 (캔버스에서 서명 데이터 읽기)
   */
  const handleConfirm = useCallback(() => {
    signatureRef.current?.readSignature();
  }, []);

  /**
   * 서명 데이터 수신 콜백
   */
  const handleOK = useCallback((sig: string) => {
    // 빈 서명 체크 (data:image/png;base64, 이후에 실제 데이터가 있는지)
    if (sig && sig.length > 100) {
      setSignature(sig);
    } else {
      Alert.alert('알림', '서명을 입력해주세요.');
    }
  }, []);

  /**
   * 서명 비어있을 때 콜백
   */
  const handleEmpty = useCallback(() => {
    Alert.alert('알림', '서명을 입력해주세요.');
  }, []);

  /**
   * 가입 요청 제출
   */
  const handleSubmit = useCallback(async () => {
    if (!signature) {
      Alert.alert('알림', '서명을 확인해주세요.');
      return;
    }

    setLoading(true);

    try {
      // registerWorker API 호출
      const result = await registerWorker({
        companyId: registrationData.companyId,
        siteId: registrationData.siteId,
        teamId: registrationData.teamId,
        phoneNumber: registrationData.phoneNumber,
        password: registrationData.password,
        name: registrationData.name,
        birthDate: registrationData.birthDate,
        gender: registrationData.gender,
        email: registrationData.email,
        nationality: registrationData.nationality,
        jobTitle: registrationData.jobTitle,
        signatureBase64: signature,
        agreedTerms,
      });

      // 토큰 저장 및 로그인 처리
      login(result.accessToken, result.refreshToken);

      // 상태 저장
      setWorkerStatus(result.status);

      // 사용자 정보 업데이트 (부분)
      setUserInfo({
        id: result.workerId,
        phoneNumber: registrationData.phoneNumber,
        name: registrationData.name,
        birthDate: registrationData.birthDate,
        isSenior: false, // 서버에서 계산됨
        gender: registrationData.gender,
        nationality: registrationData.nationality,
        jobTitle: registrationData.jobTitle,
        status: result.status,
        role: 'WORKER',
        preRegistered: false,
        isDataConflict: false,
        companyId: registrationData.companyId,
        siteId: registrationData.siteId,
        teamId: registrationData.teamId,
        createdAt: new Date().toISOString(),
      });

      // 성공 알림 후 대기 화면으로 이동
      Alert.alert('가입 요청 완료', '관리자 승인 후 이용 가능합니다.', [
        {
          text: '확인',
          onPress: () => navigation.navigate('Waiting'),
        },
      ]);
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');

      if (apiError.code === 'DUPLICATE_PHONE') {
        Alert.alert('오류', '이미 가입된 전화번호입니다.');
      } else if (apiError.code === 'SIGNATURE_REQUIRED') {
        Alert.alert('오류', '서명이 필요합니다.');
      } else if (apiError.code === 'NETWORK_ERROR') {
        Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
      } else {
        Alert.alert('오류', apiError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [
    signature,
    registrationData,
    agreedTerms,
    login,
    setWorkerStatus,
    setUserInfo,
    navigation,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>전자서명을 입력해주세요</Text>
        <Text style={styles.subtitle}>
          개인정보 수집 및 이용에 대한 동의 확인용 서명입니다
        </Text>

        {/* 서명 캔버스 */}
        <View style={styles.signatureContainer}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleOK}
            onEmpty={handleEmpty}
            descriptionText=""
            clearText="다시 쓰기"
            confirmText="서명 확인"
            webStyle={`
              .m-signature-pad--footer { display: none; }
              .m-signature-pad { box-shadow: none; border: none; }
              .m-signature-pad--body { border: none; }
              body { margin: 0; padding: 0; }
            `}
            backgroundColor={colors.backgroundGray}
            penColor={colors.textPrimary}
          />
        </View>

        {/* 서명 확인 상태 */}
        {signature && (
          <View style={styles.signatureStatus}>
            <Text style={styles.signatureStatusText}>
              서명이 확인되었습니다
            </Text>
          </View>
        )}

        {/* 버튼 행 */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            disabled={loading}>
            <Text style={styles.clearButtonText}>다시 쓰기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              signature ? styles.confirmButtonDone : undefined,
            ]}
            onPress={handleConfirm}
            disabled={loading}>
            <Text
              style={[
                styles.confirmButtonText,
                signature ? styles.confirmButtonTextDone : undefined,
              ]}>
              {signature ? '확인 완료' : '서명 확인'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            (!signature || loading) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!signature || loading}
          activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>가입 요청</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  signatureContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 200,
  },
  signatureStatus: {
    marginTop: 12,
    padding: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  signatureStatusText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDone: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonTextDone: {
    color: '#FFFFFF',
  },
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

export default SignatureScreenComponent;
