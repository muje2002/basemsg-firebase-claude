import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { apiRegisterOrLogin, setCurrentUserId } from '@/services/api';
import { saveCurrentUser } from '@/services/database';
import { connectSocket } from '@/services/socket';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = Colors.light;

  const handleLogin = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    if (!trimmedPhone) {
      Alert.alert('알림', '전화번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const user = await apiRegisterOrLogin(trimmedName, trimmedPhone);
      setCurrentUserId(user.id);
      await saveCurrentUser({ id: user.id, name: user.name, phone: user.phone });
      connectSocket(user.id);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('오류', '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      console.error('[Login]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.primary }]}>basemsg</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          시작하려면 이름과 전화번호를 입력하세요
        </ThemedText>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="이름"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="전화번호 (예: 010-1234-5678)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: loading ? colors.border : colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? '연결 중...' : '시작하기'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  form: {
    gap: Spacing.md,
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
