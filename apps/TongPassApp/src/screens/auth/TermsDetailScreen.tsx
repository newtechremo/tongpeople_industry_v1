/**
 * 약관 상세 화면
 * - 각 약관의 전체 내용을 표시
 * - TermsScreen에서 > 버튼 클릭 시 이동
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {TermsDetailScreenProps} from '@/types/navigation';
import {colors} from '@/constants/colors';
import {TERMS_CONTENT} from '@/constants/terms';

const TermsDetailScreen: React.FC<TermsDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const {termId, title} = route.params;
  const termContent = TERMS_CONTENT[termId];

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* 약관 제목 */}
        <Text style={styles.title}>{termContent?.title || title}</Text>

        {/* 약관 내용 */}
        <Text style={styles.content}>
          {termContent?.content || '약관 내용을 불러올 수 없습니다.'}
        </Text>
      </ScrollView>

      {/* 하단 확인 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleClose}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>확인</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TermsDetailScreen;
