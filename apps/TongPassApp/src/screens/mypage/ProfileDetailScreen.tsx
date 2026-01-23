/**
 * P02 프로필 상세 화면
 * - 기본 정보 섹션 (이름, 연락처, 생년월일 등)
 * - 소속 정보 섹션 (현장, 팀, 직책, 권한)
 * - 문의하기 버튼
 */

import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useRecoilValue} from 'recoil';
import {colors} from '@/constants/colors';
import {userInfoState} from '@/store/atoms/userAtom';
import {
  selectedCompanyState,
  selectedSiteState,
} from '@/store/atoms/companyAtom';
import {formatPhoneNumber, formatBirthDate} from '@/utils/format';

// 표시용 상수
const GENDER_DISPLAY: Record<string, string> = {
  M: '남성',
  F: '여성',
};

const NATIONALITY_DISPLAY: Record<string, string> = {
  KR: '대한민국',
  CN: '중국',
  VN: '베트남',
  OTHER: '기타',
};

const ROLE_DISPLAY: Record<string, string> = {
  WORKER: '팀원',
  TEAM_ADMIN: '팀 관리자',
  SITE_ADMIN: '현장 관리자',
  SUPER_ADMIN: '최고 관리자',
};

const ROLE_COLORS: Record<string, string> = {
  WORKER: colors.textPrimary,
  TEAM_ADMIN: '#EA580C',
  SITE_ADMIN: '#2563EB',
  SUPER_ADMIN: '#9333EA',
};

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({label, value, valueColor}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueColor ? {color: valueColor} : null]}>
      {value || '-'}
    </Text>
  </View>
);

const ProfileDetailScreen: React.FC = () => {
  const userInfo = useRecoilValue(userInfoState);
  const company = useRecoilValue(selectedCompanyState);
  const site = useRecoilValue(selectedSiteState);

  // 사용자 정보
  const name = userInfo?.name || '이름 없음';
  const phoneNumber = userInfo?.phoneNumber || '';
  const birthDate = userInfo?.birthDate || '';
  const gender = (userInfo as any)?.gender || '';
  const nationality = (userInfo as any)?.nationality || 'KR';
  const jobTitle = userInfo?.jobTitle || '';
  const role = userInfo?.role || 'WORKER';
  const createdAt = (userInfo as any)?.createdAt || '';
  const teamName = (userInfo as any)?.teamName || '';

  // 연락처 마스킹
  const maskedPhone = phoneNumber
    ? phoneNumber.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3')
    : '-';

  // 생년월일 포맷
  const formattedBirthDate = birthDate
    ? formatBirthDate(birthDate.replace(/-/g, ''))
    : '-';

  // 가입일 포맷
  const formattedCreatedAt = createdAt
    ? new Date(createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\. /g, '.').replace('.', '')
    : '-';

  /**
   * 정보 수정 문의
   */
  const handleContactPress = useCallback(() => {
    Alert.alert(
      '정보 수정 문의',
      '개인정보 변경은 관리자에게 문의해주세요.\n\n📞 전화: 1588-0000\n✉️ 이메일: support@tongpass.com',
      [{text: '확인'}],
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 프로필 헤더 */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profilePhone}>{maskedPhone}</Text>
        </View>

        {/* 기본 정보 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>기본 정보</Text>
          <View style={styles.cardDivider} />
          <View style={styles.cardContent}>
            <InfoRow label="이름" value={name} />
            <InfoRow label="연락처" value={maskedPhone} />
            <InfoRow label="생년월일" value={formattedBirthDate} />
            <InfoRow
              label="성별"
              value={GENDER_DISPLAY[gender] || gender || '-'}
            />
            <InfoRow
              label="국적"
              value={NATIONALITY_DISPLAY[nationality] || nationality || '-'}
            />
          </View>
        </View>

        {/* 소속 정보 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>소속 정보</Text>
          <View style={styles.cardDivider} />
          <View style={styles.cardContent}>
            <InfoRow
              label="현장"
              value={site?.name || company?.name || '-'}
            />
            <InfoRow label="소속팀" value={teamName || '-'} />
            <InfoRow label="직책" value={jobTitle || '-'} />
            <InfoRow
              label="권한"
              value={ROLE_DISPLAY[role] || role}
              valueColor={ROLE_COLORS[role]}
            />
            <InfoRow label="가입일" value={formattedCreatedAt} />
          </View>
        </View>

        {/* 정보 수정 문의 버튼 */}
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactPress}
          activeOpacity={0.7}>
          <Text style={styles.contactButtonText}>정보 수정 문의</Text>
        </TouchableOpacity>
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
  // 프로필 헤더
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.background,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  // 정보 카드
  infoCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  cardContent: {
    gap: 16,
  },
  // 정보 행
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  // 문의 버튼
  contactButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

export default ProfileDetailScreen;
