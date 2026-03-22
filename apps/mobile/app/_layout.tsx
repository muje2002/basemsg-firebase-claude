import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';
import { Colors } from '@/constants/theme';
import { setCurrentUserId, onPhoneSet } from '@/services/api';
import { connectSocket } from '@/services/socket';
import { syncUserToBackend, setAuthGetters } from '@/services/auth';

Sentry.init({
  dsn: 'https://c2f40e4294d8f4e554ed7c804208cba8@o4511083025858560.ingest.us.sentry.io/4511083055546368',
  tracesSampleRate: 1.0,
  environment: __DEV__ ? 'development' : 'production',
});

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootLayoutNav() {
  const colors = Colors.light;
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [isSynced, setIsSynced] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Register auth getters for service layer
  useEffect(() => {
    setAuthGetters(
      () => getToken(),
      () => user ? {
        fullName: user.fullName,
        firstName: user.firstName,
        primaryPhoneNumber: user.primaryPhoneNumberId
          ? user.phoneNumbers.find(p => p.id === user.primaryPhoneNumberId)?.phoneNumber ?? null
          : null,
      } : null,
    );
  }, [user, getToken]);

  // Sync Clerk user to backend DB
  useEffect(() => {
    if (!isSignedIn || !user) return;

    (async () => {
      try {
        const backendUser = await syncUserToBackend();
        setCurrentUserId(backendUser.id);
        connectSocket(backendUser.id);
        const hasPhone = !!backendUser.phone && backendUser.phone.trim() !== '';
        console.log('[Layout] Sync result:', backendUser.id, 'phone:', JSON.stringify(backendUser.phone), 'hasPhone:', hasPhone);
        setNeedsPhone(!hasPhone);
        onPhoneSet(() => setNeedsPhone(false));
        setIsSynced(true);
      } catch (e) {
        console.error('[Layout] Sync failed:', e);
      }
    })();
  }, [isSignedIn, user]);

  // Navigation guard
  useEffect(() => {
    if (!isLoaded) return;

    const inAuthScreen = segments[0] === 'login';
    const inSetupPhone = segments[0] === 'setup-phone';

    if (!isSignedIn && !inAuthScreen) {
      router.replace('/login');
    } else if (isSignedIn && isSynced) {
      if (needsPhone && !inSetupPhone) {
        router.replace('/setup-phone');
      } else if (!needsPhone && (inAuthScreen || inSetupPhone)) {
        router.replace('/(tabs)');
      }
    }
  }, [isLoaded, isSignedIn, isSynced, needsPhone, segments, router]);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
    },
  };

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'none' }} />
        <Stack.Screen name="setup-phone" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="chat/[id]" options={{ animation: 'none' }} />
        <Stack.Screen name="new-chat" options={{ animation: 'none' }} />
        <Stack.Screen name="add-friend" options={{ animation: 'none' }} />
        <Stack.Screen name="modal" options={{ animation: 'none' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <RootLayoutNav />
    </ClerkProvider>
  );
}

export default Sentry.wrap(RootLayout);
