/**
 * 근로자 정보 입력 화면
 * - 이름, 생년월일, 성별, 이메일(선택)
 * - 팀 선택, 국적, 직종 선택
 * - 선등록 데이터가 있으면 미리 채워짐
 */

import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {WorkerInfoScreenProps} from '@/types/navigation';
import {Team} from '@/types/company';
import {colors} from '@/constants/colors';
import {isValidBirthDate, isValidEmail} from '@/utils/validators';
import {getTeams} from '@/api/auth';
import {ApiError} from '@/types/api';
import {NATIONALITY_OPTIONS, JOB_TITLE_OPTIONS} from '@/constants/config';

const WorkerInfoScreen: React.FC<WorkerInfoScreenProps> = ({
  navigation,
  route,
}) => {
  const {companyId, siteId, phoneNumber, password, preRegisteredData, isTransfer, existingUserId} = route.params;

  // 기본 정보
  const [name, setName] = useState(preRegisteredData?.name || '');
  const [birthDate, setBirthDate] = useState(
    preRegisteredData?.birthDate || '',
  );
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>(
    preRegisteredData?.gender || 'M',
  );

  // 추가 정보
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState(
    preRegisteredData?.teamId || '',
  );
  const [nationality, setNationality] = useState(
    preRegisteredData?.nationality || '대한민국',
  );
  const [jobTitle, setJobTitle] = useState(preRegisteredData?.jobTitle || '');

  // 상태
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 팀 목록 조회
   */
  useEffect(() => {
    const fetchTeams = async () => {
      setTeamsLoading(true);
      try {
        const teamList = await getTeams(siteId);
        setTeams(teamList);

        // 팀이 1개면 자동 선택
        if (teamList.length === 1 && !selectedTeamId) {
          setSelectedTeamId(teamList[0].id);
        }
        // 선등록 데이터의 팀이 없으면 첫 번째 팀 선택
        else if (teamList.length > 0 && !selectedTeamId) {
          setSelectedTeamId(teamList[0].id);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[WorkerInfoScreen] getTeams error:', error);
        }
        Alert.alert('오류', '팀 목록을 불러오지 못했습니다.');
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeams();
  }, [siteId, selectedTeamId]);

  /**
   * 이름 입력 처리
   */
  const handleNameChange = useCallback((text: string) => {
    setName(text);
    setErrors(prev => ({...prev, name: ''}));
  }, []);

  /**
   * 생년월일 입력 처리
   */
  const handleBirthDateChange = useCallback((text: string) => {
    // 숫자만 허용
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 8);
    setBirthDate(cleaned);
    setErrors(prev => ({...prev, birthDate: ''}));
  }, []);

  /**
   * 이메일 입력 처리
   */
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text.toLowerCase());
    setErrors(prev => ({...prev, email: ''}));
  }, []);

  /**
   * 유효성 검사
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (name.trim().length < 2) {
      newErrors.name = '이름은 2자 이상 입력해주세요.';
    }

    if (!birthDate) {
      newErrors.birthDate = '생년월일을 입력해주세요.';
    } else if (!isValidBirthDate(birthDate)) {
      newErrors.birthDate = '올바른 생년월일을 입력해주세요. (예: 19850315)';
    }

    if (email && !isValidEmail(email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!selectedTeamId) {
      newErrors.team = '소속 팀을 선택해주세요.';
    }

    if (!jobTitle) {
      newErrors.jobTitle = '직종을 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, birthDate, email, selectedTeamId, jobTitle]);

  /**
   * 선등록 데이터와 충돌 여부 확인
   */
  const checkDataConflict = useCallback((): boolean => {
    if (!preRegisteredData) return false;

    // 주요 필드 비교 (입력 가능한 필드 중 변경된 것 확인)
    if (preRegisteredData.name && preRegisteredData.name !== name.trim()) {
      return true;
    }
    if (
      preRegisteredData.birthDate &&
      preRegisteredData.birthDate !== birthDate
    ) {
      return true;
    }
    if (preRegisteredData.gender && preRegisteredData.gender !== gender) {
      return true;
    }
    if (
      preRegisteredData.nationality &&
      preRegisteredData.nationality !== nationality
    ) {
      return true;
    }
    if (preRegisteredData.jobTitle && preRegisteredData.jobTitle !== jobTitle) {
      return true;
    }

    return false;
  }, [preRegisteredData, name, birthDate, gender, nationality, jobTitle]);

  /**
   * 약관 동의 화면으로 이동
   */
  const navigateToTerms = useCallback(
    (isDataConflict: boolean) => {
      navigation.navigate('Terms', {
        registrationData: {
          companyId,
          siteId,
          phoneNumber,
          password,
          teamId: selectedTeamId,
          name: name.trim(),
          birthDate,
          gender,
          email: email || undefined,
          nationality,
          jobTitle,
          isDataConflict,
        },
      });
    },
    [
      navigation,
      companyId,
      siteId,
      phoneNumber,
      password,
      selectedTeamId,
      name,
      birthDate,
      gender,
      email,
      nationality,
      jobTitle,
    ],
  );

  /**
   * 다음 단계로 이동
   */
  const handleNext = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 선등록 데이터와 충돌 여부 확인
      const hasConflict = checkDataConflict();

      if (hasConflict) {
        // 충돌 시 확인 팝업 표시
        Alert.alert(
          '정보 확인',
          '관리자 등록 정보와 다릅니다.\n입력한 정보로 가입하시겠습니까?',
          [
            {
              text: '취소',
              style: 'cancel',
              onPress: () => setLoading(false),
            },
            {
              text: '확인',
              onPress: () => {
                navigateToTerms(true);
                setLoading(false);
              },
            },
          ],
        );
        return;
      }

      // 충돌 없음 - 바로 이동
      navigateToTerms(false);
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');
      Alert.alert('오류', apiError.userMessage);
    } finally {
      setLoading(false);
    }
  }, [validateForm, checkDataConflict, navigateToTerms]);

  /**
   * 폼 유효 여부
   */
  const isFormValid = name.trim() && birthDate && selectedTeamId && jobTitle;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>근로자 정보 입력</Text>

          {/* 이직 안내 배너 */}
          {isTransfer && (
            <View style={styles.transferBanner}>
              <Text style={styles.transferText}>
                🔄 이직 가입입니다. 기존 계정 정보가 새 회사로 업데이트됩니다.
              </Text>
            </View>
          )}

          {/* 선등록 정보 배너 */}
          {preRegisteredData && (
            <View style={styles.preRegBanner}>
              <View style={styles.preRegHeader}>
                <Text style={styles.preRegIcon}>✓</Text>
                <Text style={styles.preRegTitle}>선등록된 정보가 있습니다</Text>
              </View>
              <Text style={styles.preRegDescription}>
                관리자가 미리 등록한 정보입니다.{'\n'}
                확인 후 다음 단계로 진행해주세요.
              </Text>
              {preRegisteredData.name && (
                <View style={styles.preRegItem}>
                  <Text style={styles.preRegLabel}>이름</Text>
                  <Text style={styles.preRegValue}>{preRegisteredData.name}</Text>
                </View>
              )}
              {preRegisteredData.teamName && (
                <View style={styles.preRegItem}>
                  <Text style={styles.preRegLabel}>소속팀</Text>
                  <Text style={styles.preRegValue}>{preRegisteredData.teamName}</Text>
                </View>
              )}
              {preRegisteredData.jobTitle && (
                <View style={styles.preRegItem}>
                  <Text style={styles.preRegLabel}>직책</Text>
                  <Text style={styles.preRegValue}>{preRegisteredData.jobTitle}</Text>
                </View>
              )}
            </View>
          )}

          {/* 이름 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름 *</Text>
            <TextInput
              style={[
                styles.input,
                errors.name ? styles.inputError : undefined,
              ]}
              value={name}
              onChangeText={handleNameChange}
              placeholder="홍길동"
              placeholderTextColor={colors.textDisabled}
              editable={!loading && !preRegisteredData?.name}
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}
          </View>

          {/* 생년월일 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>생년월일 * (8자리)</Text>
            <TextInput
              style={[
                styles.input,
                errors.birthDate ? styles.inputError : undefined,
              ]}
              value={birthDate}
              onChangeText={handleBirthDateChange}
              placeholder="19850315"
              placeholderTextColor={colors.textDisabled}
              keyboardType="number-pad"
              maxLength={8}
              editable={!loading && !preRegisteredData?.birthDate}
            />
            {errors.birthDate ? (
              <Text style={styles.errorText}>{errors.birthDate}</Text>
            ) : null}
          </View>

          {/* 성별 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>성별 *</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'M' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('M')}
                disabled={loading || !!preRegisteredData?.gender}>
                <Text
                  style={[
                    styles.genderText,
                    gender === 'M' && styles.genderTextActive,
                  ]}>
                  남성
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'F' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('F')}
                disabled={loading || !!preRegisteredData?.gender}>
                <Text
                  style={[
                    styles.genderText,
                    gender === 'F' && styles.genderTextActive,
                  ]}>
                  여성
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 이메일 (선택) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일 (선택)</Text>
            <TextInput
              style={[
                styles.input,
                errors.email ? styles.inputError : undefined,
              ]}
              value={email}
              onChangeText={handleEmailChange}
              placeholder="hong@email.com"
              placeholderTextColor={colors.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* 소속 팀 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>소속 팀 *</Text>
            {teamsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>팀 목록 불러오는 중...</Text>
              </View>
            ) : teams.length === 0 ? (
              <Text style={styles.noDataText}>등록된 팀이 없습니다.</Text>
            ) : (
              <View style={styles.selectionContainer}>
                {teams.map(team => (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.selectionItem,
                      selectedTeamId === team.id && styles.selectionItemActive,
                    ]}
                    onPress={() => {
                      setSelectedTeamId(team.id);
                      setErrors(prev => ({...prev, team: ''}));
                    }}
                    disabled={loading || !!preRegisteredData?.teamId}>
                    <Text
                      style={[
                        styles.selectionText,
                        selectedTeamId === team.id &&
                          styles.selectionTextActive,
                      ]}>
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.team ? (
              <Text style={styles.errorText}>{errors.team}</Text>
            ) : null}
          </View>

          {/* 국적 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>국적 *</Text>
            <View style={styles.selectionContainer}>
              {NATIONALITY_OPTIONS.map(nat => (
                <TouchableOpacity
                  key={nat.code}
                  style={[
                    styles.selectionItem,
                    nationality === nat.label && styles.selectionItemActive,
                  ]}
                  onPress={() => setNationality(nat.label)}
                  disabled={loading || !!preRegisteredData?.nationality}>
                  <Text
                    style={[
                      styles.selectionText,
                      nationality === nat.label && styles.selectionTextActive,
                    ]}>
                    {nat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 직종 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>직종 *</Text>
            <View style={styles.selectionContainer}>
              {JOB_TITLE_OPTIONS.map(job => (
                <TouchableOpacity
                  key={job}
                  style={[
                    styles.selectionItem,
                    jobTitle === job && styles.selectionItemActive,
                  ]}
                  onPress={() => {
                    setJobTitle(job);
                    setErrors(prev => ({...prev, jobTitle: ''}));
                  }}
                  disabled={loading || !!preRegisteredData?.jobTitle}>
                  <Text
                    style={[
                      styles.selectionText,
                      jobTitle === job && styles.selectionTextActive,
                    ]}>
                    {job}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.jobTitle ? (
              <Text style={styles.errorText}>{errors.jobTitle}</Text>
            ) : null}
          </View>

          {/* 다음 버튼 */}
          <TouchableOpacity
            style={[
              styles.button,
              (!isFormValid || loading) && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>다음</Text>
            )}
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  transferBanner: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  transferText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  banner: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  bannerText: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
  },
  // 선등록 배너
  preRegBanner: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  preRegHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  preRegIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: 8,
  },
  preRegTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  preRegDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  preRegItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(249, 115, 22, 0.2)',
  },
  preRegLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  preRegValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
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
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  genderText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  genderTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  noDataText: {
    padding: 16,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
  },
  selectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  selectionItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  selectionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectionTextActive: {
    color: colors.primary,
    fontWeight: '600',
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
});

export default WorkerInfoScreen;
