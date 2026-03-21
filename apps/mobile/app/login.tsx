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
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = Colors.light;

  const handleSignIn = useCallback(async () => {
    if (!signIn) return;
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      console.log('[Login] SignIn result status:', result.status, JSON.stringify(result));
      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId });
      } else {
        Alert.alert('로그인 오류', `예상치 못한 상태: ${result.status}`);
      }
    } catch (err: unknown) {
      console.log('[Login] SignIn error:', JSON.stringify(err));
      const clerkErr = err as { errors?: { message: string }[] };
      const message = clerkErr?.errors?.[0]?.message
        ?? (err instanceof Error ? err.message : '로그인에 실패했습니다.');
      Alert.alert('로그인 오류', message);
    } finally {
      setLoading(false);
    }
  }, [signIn, email, password, setSignInActive]);

  const handleSignUp = useCallback(async () => {
    if (!signUp) return;
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      console.error('[Login] SignUp error:', JSON.stringify(err));
      const clerkErr = err as { errors?: { message: string }[] };
      const message = clerkErr?.errors?.[0]?.message
        ?? (err instanceof Error ? err.message : '회원가입에 실패했습니다.');
      Alert.alert('회원가입 오류', message);
    } finally {
      setLoading(false);
    }
  }, [signUp, email, password]);

  const handleVerify = useCallback(async () => {
    if (!signUp) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
        // _layout.tsx will handle navigation after sync
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '인증에 실패했습니다.';
      Alert.alert('인증 오류', message);
    } finally {
      setLoading(false);
    }
  }, [signUp, code, setSignUpActive]);

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <ThemedText style={[styles.title, { color: colors.primary }]}>이메일 인증</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            이메일로 전송된 인증 코드를 입력하세요
          </ThemedText>
          <View style={styles.form}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              value={code}
              onChangeText={setCode}
              placeholder="인증 코드"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: loading ? colors.border : colors.primary }]}
              onPress={handleVerify}
              disabled={loading}
            >
              <ThemedText style={styles.buttonText}>
                {loading ? '확인 중...' : '인증 완료'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.primary }]}>basemsg</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isSignUpMode ? '새 계정을 만들어 시작하세요' : '로그인하여 시작하세요'}
        </ThemedText>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="이메일"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: loading ? colors.border : colors.primary }]}
            onPress={isSignUpMode ? handleSignUp : handleSignIn}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? '처리 중...' : isSignUpMode ? '회원가입' : '로그인'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUpMode(!isSignUpMode)}
          >
            <ThemedText style={[styles.switchText, { color: colors.textSecondary }]}>
              {isSignUpMode ? '이미 계정이 있나요? ' : '계정이 없나요? '}
              <ThemedText style={{ color: colors.primary }}>
                {isSignUpMode ? '로그인' : '회원가입'}
              </ThemedText>
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
  switchButton: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  switchText: {
    fontSize: 14,
  },
});
