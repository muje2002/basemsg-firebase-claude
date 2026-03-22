import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { user } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const userName = user?.fullName ?? user?.firstName ?? '-';
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? '-';
  const userPhone = user?.primaryPhoneNumber?.phoneNumber ?? '-';

  const handleSignOut = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>설정</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 내 정보 */}
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>내 정보</ThemedText>
        <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>이름</ThemedText>
            <ThemedText style={styles.value}>{userName}</ThemedText>
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>이메일</ThemedText>
            <ThemedText style={styles.value}>{userEmail}</ThemedText>
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>전화번호</ThemedText>
            <ThemedText style={styles.value}>{userPhone}</ThemedText>
          </View>
        </View>

        {/* 알림 설정 */}
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>알림 설정</ThemedText>
        <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.row}>
            <ThemedText style={styles.value}>알림</ThemedText>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notificationsEnabled ? colors.primary : colors.icon}
            />
          </View>
        </View>

        {/* 앱 정보 */}
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>앱 정보</ThemedText>
        <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>버전</ThemedText>
            <ThemedText style={styles.value}>1.0.0</ThemedText>
          </View>
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={handleSignOut}
        >
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <ThemedText style={[styles.signOutText, { color: colors.error }]}>로그아웃</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg,
  },
  label: {
    fontSize: 15,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: Spacing.lg,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
