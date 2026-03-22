import { useState, useCallback } from 'react';
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
import { apiSetPhone } from '@/services/api';

export default function SetupPhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = Colors.light;

  const formatPhoneInput = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  const handleSetPhone = useCallback(async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      Alert.alert('입력 오류', '올바른 전화번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiSetPhone(digits);
      if (result.friendsAdded > 0) {
        Alert.alert(
          '전화번호 설정 완료',
          `${result.friendsAdded}명의 친구가 자동으로 추가되었습니다!`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }],
        );
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '전화번호 설정에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  }, [phone, router]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.primary }]}>전화번호 설정</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          친구를 찾기 위해 전화번호를 입력해주세요
        </ThemedText>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={phone}
            onChangeText={(text) => setPhone(formatPhoneInput(text))}
            placeholder="010-0000-0000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            maxLength={13}
          />

          <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
            연락처에 저장된 친구들이 이 번호로 나를 찾을 수 있습니다.
          </ThemedText>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: loading ? colors.border : colors.primary }]}
            onPress={handleSetPhone}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? '설정 중...' : '설정 완료'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  form: { gap: Spacing.md },
  input: {
    fontSize: 20,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    textAlign: 'center',
    letterSpacing: 1,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
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
