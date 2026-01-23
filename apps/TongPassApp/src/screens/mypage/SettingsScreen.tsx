/**
 * P03 설정 화면
 * - 알림 설정 (푸시, 출퇴근, 공지사항)
 * - 앱 정보 (버전, 라이선스)
 * - 계정 (로그아웃, 회원 탈퇴)
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors} from '@/constants/colors';
import {useAuth} from '@/hooks/useAuth';

// 앱 버전 (실제로는 package.json 또는 native config에서 가져옴)
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

interface NotificationSettings {
  push: boolean;
  commute: boolean;
  announcement: boolean;
}

interface SettingItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  label,
  value,
  onPress,
  showArrow = true,
  danger = false,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}>
    <Text style={styles.settingIcon}>{icon}</Text>
    <View style={styles.settingContent}>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>
        {label}
      </Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
    </View>
    {showArrow && onPress && <Text style={styles.settingArrow}>›</Text>}
  </TouchableOpacity>
);

interface SettingToggleProps {
  icon: string;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}) => (
  <View style={styles.settingItem}>
    <Text style={styles.settingIcon}>{icon}</Text>
    <View style={styles.settingContent}>
      <Text style={styles.settingLabel}>{label}</Text>
      {description && (
        <Text style={styles.settingDescription}>{description}</Text>
      )}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{false: colors.border, true: colors.primary}}
      thumbColor={colors.background}
      disabled={disabled}
    />
  </View>
);

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {logout} = useAuth();

  // 알림 설정 상태
  const [notifications, setNotifications] = useState<NotificationSettings>({
    push: true,
    commute: true,
    announcement: true,
  });
  const [savingNotification, setSavingNotification] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  /**
   * 알림 설정 변경
   */
  const handleNotificationChange = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      setSavingNotification(true);

      // 낙관적 업데이트
      setNotifications(prev => ({...prev, [key]: value}));

      try {
        // TODO: API 호출 - PATCH /notification-settings
        await new Promise<void>(resolve => setTimeout(resolve, 500));
      } catch (error) {
        // 실패 시 롤백
        setNotifications(prev => ({...prev, [key]: !value}));
        Alert.alert('오류', '설정 변경에 실패했습니다.');
      } finally {
        setSavingNotification(false);
      }
    },
    [],
  );

  /**
   * 로그아웃
   */
  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }, [logout]);

  /**
   * 회원 탈퇴
   */
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      '회원 탈퇴',
      '정말 탈퇴하시겠습니까?\n\n탈퇴 시 모든 데이터가 삭제되며,\n복구할 수 없습니다.',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ],
    );
  }, []);

  const confirmDeleteAccount = useCallback(async () => {
    setDeletingAccount(true);

    try {
      // TODO: API 호출 - DELETE /worker-me
      await new Promise<void>(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        '탈퇴 완료',
        '회원 탈퇴가 완료되었습니다.\n그동안 이용해 주셔서 감사합니다.',
        [
          {
            text: '확인',
            onPress: async () => {
              await logout();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('오류', '회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setDeletingAccount(false);
    }
  }, [logout]);

  /**
   * 이용약관 보기
   */
  const handleTermsPress = useCallback(() => {
    // TODO: 약관 상세 화면 또는 웹뷰로 이동
    Alert.alert('이용약관', '이용약관 내용을 표시합니다.');
  }, []);

  /**
   * 개인정보 처리방침 보기
   */
  const handlePrivacyPress = useCallback(() => {
    // TODO: 개인정보 처리방침 화면 또는 웹뷰로 이동
    Alert.alert('개인정보 처리방침', '개인정보 처리방침 내용을 표시합니다.');
  }, []);

  /**
   * 오픈소스 라이선스 보기
   */
  const handleLicensePress = useCallback(() => {
    Alert.alert('오픈소스 라이선스', '사용된 오픈소스 라이브러리 목록을 표시합니다.');
  }, []);

  /**
   * 문의하기
   */
  const handleContactPress = useCallback(() => {
    Alert.alert(
      '문의하기',
      '이메일로 문의하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '이메일 보내기',
          onPress: () => {
            Linking.openURL('mailto:support@tongpass.com?subject=TongPass 앱 문의');
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 설정</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="🔔"
              label="푸시 알림"
              description="앱 알림 수신"
              value={notifications.push}
              onValueChange={value => handleNotificationChange('push', value)}
              disabled={savingNotification}
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="⏰"
              label="출퇴근 알림"
              description="출퇴근 시간 알림"
              value={notifications.commute}
              onValueChange={value => handleNotificationChange('commute', value)}
              disabled={savingNotification || !notifications.push}
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="📢"
              label="공지사항 알림"
              description="새 공지사항 알림"
              value={notifications.announcement}
              onValueChange={value =>
                handleNotificationChange('announcement', value)
              }
              disabled={savingNotification || !notifications.push}
            />
          </View>
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.card}>
            <SettingItem
              icon="📱"
              label="앱 버전"
              value={`${APP_VERSION} (${BUILD_NUMBER})`}
              showArrow={false}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="📄"
              label="이용약관"
              onPress={handleTermsPress}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="🔒"
              label="개인정보 처리방침"
              onPress={handlePrivacyPress}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="📚"
              label="오픈소스 라이선스"
              onPress={handleLicensePress}
            />
          </View>
        </View>

        {/* 고객 지원 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>고객 지원</Text>
          <View style={styles.card}>
            <SettingItem
              icon="✉️"
              label="문의하기"
              value="support@tongpass.com"
              onPress={handleContactPress}
            />
          </View>
        </View>

        {/* 계정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.card}>
            <SettingItem
              icon="🚪"
              label="로그아웃"
              onPress={handleLogout}
              showArrow={false}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="⚠️"
              label="회원 탈퇴"
              onPress={handleDeleteAccount}
              showArrow={false}
              danger
            />
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>TongPass</Text>
          <Text style={styles.footerVersion}>v{APP_VERSION}</Text>
        </View>
      </ScrollView>

      {/* 계정 삭제 로딩 */}
      {deletingAccount && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>탈퇴 처리 중...</Text>
          </View>
        </View>
      )}
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
  // 섹션
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  // 설정 아이템
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  settingLabelDanger: {
    color: colors.error,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 20,
    color: colors.textDisabled,
    marginLeft: 8,
  },
  // 푸터
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDisabled,
  },
  footerVersion: {
    fontSize: 12,
    color: colors.textDisabled,
    marginTop: 4,
  },
  // 로딩 오버레이
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
});

export default SettingsScreen;
