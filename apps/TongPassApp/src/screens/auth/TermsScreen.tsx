/**
 * 약관 동의 화면
 * - 4개 필수 약관 동의
 * - 전체 동의 기능
 * - 개별 약관 내용 보기 (TODO)
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
import {TermsScreenProps} from '@/types/navigation';
import {colors} from '@/constants/colors';
import {TERMS_LIST} from '@/constants/config';

const TermsScreen: React.FC<TermsScreenProps> = ({navigation, route}) => {
  const {registrationData} = route.params;
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});

  /**
   * 모든 필수 약관 동의 여부
   */
  const isAllAgreed = TERMS_LIST.every(term => agreed[term.id]);

  /**
   * 개별 약관 토글
   */
  const toggleTerm = useCallback((termId: string) => {
    setAgreed(prev => ({...prev, [termId]: !prev[termId]}));
  }, []);

  /**
   * 전체 동의 토글
   */
  const toggleAll = useCallback(() => {
    const newValue = !isAllAgreed;
    const newAgreed: Record<string, boolean> = {};
    TERMS_LIST.forEach(term => {
      newAgreed[term.id] = newValue;
    });
    setAgreed(newAgreed);
  }, [isAllAgreed]);

  /**
   * 다음 단계로 이동 (서명 화면)
   */
  const handleNext = useCallback(() => {
    // 동의한 약관 ID 배열
    const agreedTermIds = TERMS_LIST.filter(term => agreed[term.id]).map(
      term => term.id,
    );

    navigation.navigate('Signature', {
      registrationData,
      agreedTerms: agreedTermIds,
    });
  }, [navigation, registrationData, agreed]);

  /**
   * 약관 상세 보기
   */
  const handleViewTerm = useCallback(
    (termId: string, label: string) => {
      navigation.navigate('TermsDetail', {
        termId,
        title: label,
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>약관에 동의해주세요</Text>
          <Text style={styles.subtitle}>
            서비스 이용을 위해 아래 약관에 동의해주세요
          </Text>

          {/* 전체 동의 */}
          <TouchableOpacity
            style={styles.allAgreeButton}
            onPress={toggleAll}
            activeOpacity={0.7}>
            <View
              style={[styles.checkbox, isAllAgreed && styles.checkboxActive]}>
              {isAllAgreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.allAgreeText}>전체 동의</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 개별 약관 목록 */}
          {TERMS_LIST.map(term => (
            <View key={term.id} style={styles.termRow}>
              <TouchableOpacity
                style={styles.termItem}
                onPress={() => toggleTerm(term.id)}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.checkbox,
                    agreed[term.id] && styles.checkboxActive,
                  ]}>
                  {agreed[term.id] && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termText}>
                  ({term.required ? '필수' : '선택'}) {term.label}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => handleViewTerm(term.id, term.label)}>
                <Text style={styles.arrow}>{'>'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !isAllAgreed && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!isAllAgreed}
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
  content: {
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
  allAgreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
  },
  allAgreeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  termItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  viewButton: {
    padding: 8,
  },
  arrow: {
    color: colors.textDisabled,
    fontSize: 16,
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

export default TermsScreen;
