import { useEffect, useState } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { getCurrentUser } from '@/services/database';
import { setCurrentUserId } from '@/services/api';
import { connectSocket } from '@/services/socket';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colors = Colors.light;
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        connectSocket(user.id);
        setIsLoggedIn(true);
      }
      setIsReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isReady, isLoggedIn, router]);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="chat/[id]"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="new-chat"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="add-friend"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
