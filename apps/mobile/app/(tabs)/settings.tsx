import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUser, getCurrentUserId } from '@/services/api';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userName, setUserName] = useState('-');
  const [userEmail, setUserEmail] = useState('-');
  const [userPhone, setUserPhone] = useState('-');
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  const loadUserInfo = useCallback(async () => {
    try {
      const userId = getCurrentUserId();
      const backendUser = await getUser(userId);
      setUserName(backendUser.name || '-');
      setUserPhone(backendUser.phone || '-');
    } catch {
      // Fallback to Clerk user info
    }
    setUserEmail(clerkUser?.primaryEmailAddress?.emailAddress ?? '-');
  }, [clerkUser]);

  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
    }, [loadUserInfo])
  );

  const handleEditName = () => {
    setNameInput(userName === '-' ? '' : userName);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    try {
      const { apiUpdateMe } = await import('@/services/api');
      const updated = await apiUpdateMe({ name: nameInput.trim() });
      setUserName(updated.name);
      Alert.alert('완료', '이름이 변경되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '이름 변경에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setEditingName(false);
    }
  };

  const handleEditPhone = () => {
    setPhoneInput(userPhone === '-' ? '' : userPhone);
    setEditingPhone(true);
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) return;
    try {
      const { apiSetPhone, notifyPhoneSet } = await import('@/services/api');
      const result = await apiSetPhone(phoneInput.replace(/\D/g, ''));
      setUserPhone(result.user.phone || phoneInput);
      notifyPhoneSet();
      Alert.alert('완료', '전화번호가 변경되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '전화번호 변경에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setEditingPhone(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>설정</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>내 정보</ThemedText>
        <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.row} onPress={handleEditName}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>이름</ThemedText>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveName}>
                  <MaterialIcons name="check" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.valueRow}>
                <ThemedText style={styles.value}>{userName}</ThemedText>
                <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>이메일</ThemedText>
            <ThemedText style={styles.value}>{userEmail}</ThemedText>
          </View>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row} onPress={handleEditPhone}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>전화번호</ThemedText>
            {editingPhone ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  keyboardType="phone-pad"
                  autoFocus
                />
                <TouchableOpacity onPress={handleSavePhone}>
                  <MaterialIcons name="check" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.valueRow}>
                <ThemedText style={styles.value}>{userPhone}</ThemedText>
                <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

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

        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>앱 정보</ThemedText>
        <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>버전</ThemedText>
            <ThemedText style={styles.value}>1.0.0</ThemedText>
          </View>
        </View>

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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, fontWeight: '700' },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm,
    marginTop: Spacing.lg, marginLeft: Spacing.xs, textTransform: 'uppercase',
  },
  section: {
    borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 48,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.lg },
  label: { fontSize: 15 },
  value: { fontSize: 15, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: Spacing.lg },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, justifyContent: 'flex-end' },
  editInput: {
    fontSize: 15, borderWidth: 1, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 4, minWidth: 150, textAlign: 'right',
  },
  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.sm,
  },
  signOutText: { fontSize: 16, fontWeight: '600' },
});
