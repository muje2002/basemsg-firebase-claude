import type { User } from '@basemsg/shared';
import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  const Constants = require('expo-constants').default;
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const origin = `http://${debuggerHost.split(':')[0]}:8081`;
    return `${origin}/api`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
  return 'http://localhost:3000/api';
};

const BASE_URL = getBaseUrl();

/**
 * Clerk 로그인 후 백엔드 DB에 사용자를 동기화합니다.
 * Clerk 토큰을 Authorization 헤더로 보냅니다.
 */
export async function syncUserToBackend(): Promise<User> {
  // @clerk/clerk-expo의 useAuth에서 getToken을 가져와야 하지만,
  // 서비스 레이어에서는 전역 토큰 getter를 사용합니다.
  const token = await globalGetToken();
  if (!token) throw new Error('No auth token available');

  const clerkUser = globalGetClerkUser();
  if (!clerkUser) throw new Error('No Clerk user available');

  const res = await fetch(`${BASE_URL}/users/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: clerkUser.fullName ?? clerkUser.firstName ?? 'User',
      phone: clerkUser.primaryPhoneNumber ?? '',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sync failed ${res.status}: ${body}`);
  }

  return res.json();
}

// Global token/user getters — set from _layout.tsx
let globalGetToken: () => Promise<string | null> = async () => null;
let globalGetClerkUser: () => ClerkUserInfo | null = () => null;

interface ClerkUserInfo {
  fullName: string | null;
  firstName: string | null;
  primaryPhoneNumber: string | null;
}

export function setAuthGetters(
  getToken: () => Promise<string | null>,
  getClerkUser: () => ClerkUserInfo | null,
) {
  globalGetToken = getToken;
  globalGetClerkUser = getClerkUser;
}

/**
 * API 요청에 Clerk 토큰을 포함하는 헬퍼
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await globalGetToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
