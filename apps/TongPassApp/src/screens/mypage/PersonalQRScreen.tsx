/**
 * P05 개인 QR 발급 화면
 * - 개인 고유 QR 코드 표시
 * - 30초 타이머 + 자동 새로고침
 * - DynamicQRCode 컴포넌트 재사용
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useRecoilValue} from 'recoil';
import {colors} from '@/constants/colors';
import {userInfoState} from '@/store/atoms/userAtom';
import {
  selectedCompanyState,
  selectedSiteState,
} from '@/store/atoms/companyAtom';
import DynamicQRCode from '@/components/qr/DynamicQRCode';

const PersonalQRScreen: React.FC = () => {
  const userInfo = useRecoilValue(userInfoState);
  const company = useRecoilValue(selectedCompanyState);
  const site = useRecoilValue(selectedSiteState);

  const userName = userInfo?.name || '근로자';
  const teamName = (userInfo as any)?.teamName || '';
  const siteName = site?.name || company?.name || '';
  const jobTitle = userInfo?.jobTitle || '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 안내 메시지 */}
        <View style={styles.guideContainer}>
          <Text style={styles.guideIcon}>📱</Text>
          <Text style={styles.guideTitle}>개인 QR 코드</Text>
          <Text style={styles.guideText}>
            관리자에게 이 QR 코드를 보여주세요.{'\n'}
            출퇴근 처리에 사용됩니다.
          </Text>
        </View>

        {/* QR 코드 카드 */}
        <View style={styles.qrCard}>
          {/* 사용자 정보 */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userMeta}>
                {siteName}
                {teamName ? ` · ${teamName}` : ''}
              </Text>
              {jobTitle && <Text style={styles.userJob}>{jobTitle}</Text>}
            </View>
          </View>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* QR 코드 */}
          <View style={styles.qrContainer}>
            <DynamicQRCode size={220} />
          </View>
        </View>

        {/* 주의사항 */}
        <View style={styles.noticeContainer}>
          <View style={styles.noticeItem}>
            <Text style={styles.noticeIcon}>⚠️</Text>
            <Text style={styles.noticeText}>
              QR 코드는 보안을 위해 30초마다 자동으로 갱신됩니다.
            </Text>
          </View>
          <View style={styles.noticeItem}>
            <Text style={styles.noticeIcon}>📸</Text>
            <Text style={styles.noticeText}>
              스크린샷으로 저장된 QR 코드는 사용할 수 없습니다.
            </Text>
          </View>
          <View style={styles.noticeItem}>
            <Text style={styles.noticeIcon}>🔒</Text>
            <Text style={styles.noticeText}>
              QR 코드를 타인에게 공유하지 마세요.
            </Text>
          </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // 안내
  guideContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  guideIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  guideText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // QR 카드
  qrCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  // 사용자 정보
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.background,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userJob: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 20,
  },
  // QR 컨테이너
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  // 주의사항
  noticeContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noticeIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default PersonalQRScreen;
