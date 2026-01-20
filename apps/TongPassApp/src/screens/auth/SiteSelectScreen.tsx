/**
 * 현장 선택 화면
 * - 회사코드 검증 후 현장이 2개 이상일 때 표시
 * - 사용자가 가입할 현장을 선택
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useSetRecoilState} from 'recoil';
import {SiteSelectScreenProps} from '@/types/navigation';
import {selectedSiteState} from '@/store/atoms/companyAtom';
import {colors} from '@/constants/colors';

const SiteSelectScreen: React.FC<SiteSelectScreenProps> = ({
  navigation,
  route,
}) => {
  const {companyId, companyName, sites} = route.params;
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const setSite = useSetRecoilState(selectedSiteState);

  /**
   * 현장 선택 처리
   */
  const handleSiteSelect = useCallback((siteId: string) => {
    setSelectedSiteId(siteId);
  }, []);

  /**
   * 다음 단계로 이동 (전화번호 인증)
   */
  const handleNext = useCallback(() => {
    if (!selectedSiteId) {
      return;
    }

    const selectedSite = sites.find(site => site.id === selectedSiteId);
    if (!selectedSite) {
      return;
    }

    // Recoil 상태 업데이트
    setSite(selectedSite);

    // 전화번호 인증 화면으로 이동
    navigation.navigate('PhoneVerify', {
      companyId,
      siteId: selectedSiteId,
    });
  }, [selectedSiteId, sites, companyId, navigation, setSite]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.title}>현장을 선택해주세요</Text>
          <Text style={styles.subtitle}>
            가입할 현장을 선택하고 다음 단계로 진행하세요
          </Text>
        </View>

        {/* 현장 목록 */}
        <View style={styles.sitesContainer}>
          {sites.map(site => {
            const isSelected = selectedSiteId === site.id;

            return (
              <TouchableOpacity
                key={site.id}
                style={[styles.siteCard, isSelected && styles.siteCardSelected]}
                onPress={() => handleSiteSelect(site.id)}
                activeOpacity={0.7}>
                {/* 선택 라디오 버튼 */}
                <View
                  style={[
                    styles.radio,
                    isSelected && styles.radioSelected,
                  ]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>

                {/* 현장 정보 */}
                <View style={styles.siteInfo}>
                  <Text
                    style={[
                      styles.siteName,
                      isSelected && styles.siteNameSelected,
                    ]}>
                    {site.name}
                  </Text>
                  {site.address ? (
                    <Text style={styles.siteAddress}>{site.address}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selectedSiteId && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!selectedSiteId}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>다음</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  companyName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
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
    lineHeight: 20,
  },
  sitesContainer: {
    gap: 12,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  siteCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  siteNameSelected: {
    color: colors.primary,
  },
  siteAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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

export default SiteSelectScreen;
