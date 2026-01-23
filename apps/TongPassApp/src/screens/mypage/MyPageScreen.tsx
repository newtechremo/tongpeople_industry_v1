/**
 * 마이페이지 화면 (P01)
 * - 프로필 카드
 * - 이번 달 통계
 * - 메뉴 리스트
 * - Phase 2에서 상세 구현 예정
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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRecoilValue} from 'recoil';
import {colors} from '@/constants/colors';
import {userInfoState} from '@/store/atoms/userAtom';
import {
  selectedCompanyState,
  selectedSiteState,
} from '@/store/atoms/companyAtom';
import {useAuth} from '@/hooks/useAuth';
import {MyPageStackParamList} from '@/types/navigation';

type NavigationProp = NativeStackNavigationProp<MyPageStackParamList>;

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
}

const MyPageScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {logout} = useAuth();
  const userInfo = useRecoilValue(userInfoState);
  const company = useRecoilValue(selectedCompanyState);
  const site = useRecoilValue(selectedSiteState);

  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '확인',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }, [logout]);

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      icon: '👤',
      label: '내 정보',
      onPress: () => navigation.navigate('ProfileDetail'),
    },
    {
      id: 'qr',
      icon: '📱',
      label: '개인 QR 코드',
      onPress: () => navigation.navigate('PersonalQR'),
    },
    {
      id: 'company',
      icon: '🏢',
      label: '참여 회사',
      onPress: () => navigation.navigate('CompanyList'),
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: '설정',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'terms',
      icon: '📄',
      label: '이용약관',
      onPress: () =>
        Alert.alert('준비 중', '해당 기능은 준비 중입니다.'),
    },
    {
      id: 'version',
      icon: 'ℹ️',
      label: '앱 정보',
      onPress: () => Alert.alert('앱 정보', 'TongPass v1.0.0'),
    },
  ];

  // 사용자 이름 (기본값 처리)
  const userName = userInfo?.name || '근로자';
  const siteName = site?.name || company?.name || '';
  const teamName = (userInfo as any)?.teamName || '';
  const jobTitle = userInfo?.jobTitle || '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>마이페이지</Text>
        </View>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileDetail}>
              {siteName}
              {teamName ? ` · ${teamName}` : ''}
            </Text>
            {jobTitle && (
              <Text style={styles.profileJob}>{jobTitle}</Text>
            )}
          </View>
        </View>

        {/* 이번 달 통계 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>이번 달 근무</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>-</Text>
              <Text style={styles.statLabel}>출근일</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>-</Text>
              <Text style={styles.statLabel}>근무시간</Text>
            </View>
          </View>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menuSection}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
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
  header: {
    padding: 24,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  // 프로필 카드
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  profileJob: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
  },
  // 통계 카드
  statsCard: {
    backgroundColor: colors.background,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  // 메뉴 섹션
  menuSection: {
    backgroundColor: colors.background,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textDisabled,
  },
  // 로그아웃 버튼
  logoutButton: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});

export default MyPageScreen;
