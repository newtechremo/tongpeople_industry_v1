/**
 * P04 참여 회사 목록 화면
 * - 참여한 회사 목록 표시
 * - 회사 선택 시 해당 컨텍스트로 전환
 * - 새 회사 추가 기능
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRecoilState, useRecoilValue} from 'recoil';
import {colors} from '@/constants/colors';
import {
  selectedCompanyState,
  selectedSiteState,
} from '@/store/atoms/companyAtom';
import {userInfoState} from '@/store/atoms/userAtom';
import {getMyCompanies, CompanyWithSite} from '@/api/company';
import {ApiError} from '@/types/api';
import {RootStackParamList} from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CompanyListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const userInfo = useRecoilValue(userInfoState);
  const [selectedCompany, setSelectedCompany] = useRecoilState(selectedCompanyState);
  const [, setSelectedSite] = useRecoilState(selectedSiteState);

  const [companies, setCompanies] = useState<CompanyWithSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 회사 목록 불러오기
   */
  const fetchCompanies = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await getMyCompanies();
      setCompanies(result);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('UNKNOWN_ERROR');
      setError(apiError.userMessage);
      if (__DEV__) {
        console.warn('[CompanyListScreen] fetchCompanies error:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  /**
   * 새로고침
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompanies(false);
  }, [fetchCompanies]);

  /**
   * 회사 선택
   */
  const handleSelectCompany = useCallback(
    (company: CompanyWithSite) => {
      if (selectedCompany?.id === company.id) {
        Alert.alert('알림', '이미 선택된 회사입니다.');
        return;
      }

      Alert.alert(
        '회사 전환',
        `${company.name}(으)로 전환하시겠습니까?\n현재 화면이 초기화됩니다.`,
        [
          {text: '취소', style: 'cancel'},
          {
            text: '전환',
            onPress: () => {
              // 회사 및 현장 정보 업데이트
              setSelectedCompany({
                id: company.id,
                name: company.name,
                code: company.code,
                logo: company.logo,
              });
              setSelectedSite({
                id: company.site.id,
                name: company.site.name,
                address: company.site.address,
                companyId: company.id,
              });

              Alert.alert('전환 완료', `${company.name}(으)로 전환되었습니다.`);
            },
          },
        ],
      );
    },
    [selectedCompany, setSelectedCompany, setSelectedSite],
  );

  /**
   * 새 회사 추가
   */
  const handleAddCompany = useCallback(() => {
    Alert.alert(
      '새 회사 추가',
      '새로운 회사에 가입하시겠습니까?\n회사코드를 입력하여 가입할 수 있습니다.',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '추가하기',
          onPress: () => {
            // 인증 스택의 CompanyCode 화면으로 이동
            navigation.navigate('Auth');
          },
        },
      ],
    );
  }, [navigation]);

  /**
   * 회사 카드 렌더링
   */
  const renderCompanyCard = (company: CompanyWithSite) => {
    const isSelected = selectedCompany?.id === company.id;

    return (
      <TouchableOpacity
        key={company.id}
        style={[styles.companyCard, isSelected && styles.companyCardSelected]}
        onPress={() => handleSelectCompany(company)}
        activeOpacity={0.7}>
        {/* 회사 로고 또는 이니셜 */}
        <View style={[styles.companyLogo, isSelected && styles.companyLogoSelected]}>
          <Text style={[styles.companyLogoText, isSelected && styles.companyLogoTextSelected]}>
            {company.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* 회사 정보 */}
        <View style={styles.companyInfo}>
          <View style={styles.companyHeader}>
            <Text style={styles.companyName}>{company.name}</Text>
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>현재</Text>
              </View>
            )}
          </View>
          <Text style={styles.siteName}>{company.site.name}</Text>
          <Text style={styles.siteAddress} numberOfLines={1}>
            {company.site.address}
          </Text>
          {company.joinedAt && (
            <Text style={styles.joinedDate}>
              가입일: {new Date(company.joinedAt).toLocaleDateString('ko-KR')}
            </Text>
          )}
        </View>

        {/* 선택 아이콘 */}
        <View style={styles.selectIcon}>
          <Text style={[styles.selectIconText, isSelected && styles.selectIconTextSelected]}>
            {isSelected ? '✓' : '›'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 로딩 상태
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>회사 목록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchCompanies()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* 안내 텍스트 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>
            {userInfo?.name || '근로자'}님의 참여 회사
          </Text>
          <Text style={styles.infoSubtitle}>
            회사를 선택하여 해당 회사의 출퇴근 기록을 확인하세요.
          </Text>
        </View>

        {/* 회사 목록 */}
        <View style={styles.companyList}>
          {companies.length > 0 ? (
            companies.map(renderCompanyCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyText}>참여 중인 회사가 없습니다.</Text>
              <Text style={styles.emptySubtext}>
                회사코드를 입력하여 새 회사에 가입해보세요.
              </Text>
            </View>
          )}
        </View>

        {/* 새 회사 추가 버튼 */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCompany}
          activeOpacity={0.7}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>새 회사 추가</Text>
        </TouchableOpacity>

        {/* 안내 카드 */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>안내</Text>
          <Text style={styles.helpText}>
            • 여러 회사에 동시에 가입할 수 있습니다{'\n'}
            • 회사 전환 시 해당 회사의 출퇴근 기록이 표시됩니다{'\n'}
            • 각 회사별로 별도의 출퇴근 관리가 가능합니다
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  // 에러
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.error,
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 16,
    overflow: 'hidden',
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // 안내 섹션
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // 회사 목록
  companyList: {
    gap: 12,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  companyCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyLogoSelected: {
    backgroundColor: colors.primary,
  },
  companyLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  companyLogoTextSelected: {
    color: '#FFF',
  },
  companyInfo: {
    flex: 1,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  selectedBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  siteName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  siteAddress: {
    fontSize: 12,
    color: colors.textDisabled,
  },
  joinedDate: {
    fontSize: 11,
    color: colors.textDisabled,
    marginTop: 4,
  },
  selectIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectIconText: {
    fontSize: 20,
    color: colors.textDisabled,
  },
  selectIconTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  // 빈 상태
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // 추가 버튼
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  // 안내 카드
  helpCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default CompanyListScreen;
