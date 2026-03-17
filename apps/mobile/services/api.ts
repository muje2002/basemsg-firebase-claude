import type { ChatRoom, Message, User, Friend } from '@basemsg/shared';

import { Platform } from 'react-native';
import { getAuthHeaders } from '@/services/auth';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // Web: use same origin (dev-proxy serves both Expo web and API)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  // Native (Expo Go on physical device or emulator):
  // Use the Expo dev server origin which proxies /api to backend via metro.config.js
  const Constants = require('expo-constants').default;
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const origin = `http://${debuggerHost.split(':')[0]}:8081`;
    return `${origin}/api`;
  }

  // Android emulator fallback
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
  // iOS simulator / fallback
  return 'http://localhost:3000/api';
};

const BASE_URL = getBaseUrl();

// Temporary hardcoded user ID until auth is implemented
export const CURRENT_USER_ID_KEY = 'basemsg:currentUserId';
let currentUserId: string | null = null;

export function setCurrentUserId(id: string) {
  currentUserId = id;
}

export function getCurrentUserId(): string {
  if (!currentUserId) {
    throw new Error('User ID not set. Call setCurrentUserId() first.');
  }
  return currentUserId;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

function withUserId(path: string): string {
  const userId = getCurrentUserId();
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}userId=${userId}`;
}

// ── Users ──

export async function createUser(data: { name: string; phone: string; avatarUrl?: string }): Promise<User> {
  return request('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function getUser(id: string): Promise<User> {
  return request(`/users/${id}`);
}

export async function getAllUsers(): Promise<User[]> {
  return request('/users');
}

// ── Friends ──

export async function apiFetchFriends(): Promise<Friend[]> {
  return request(withUserId('/friends'));
}

export async function apiAddFriend(friendId: string): Promise<Friend> {
  return request(withUserId('/friends'), {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  });
}

export async function apiRemoveFriend(friendId: string): Promise<void> {
  return request(withUserId(`/friends/${friendId}`), { method: 'DELETE' });
}

export async function apiAddFriendsByPhones(
  phones: string[],
): Promise<{ added: Array<{ id: string; name: string; phone: string }>; notFound: string[] }> {
  return request(withUserId('/friends/by-phones'), {
    method: 'POST',
    body: JSON.stringify({ phones }),
  });
}

// ── Chat Rooms ──

export interface ApiChatRoom {
  id: string;
  name: string;
  createdAt: string;
  participants: Array<{
    id: string;
    user: User;
    joinedAt: string;
  }>;
}

export async function apiFetchChatRooms(): Promise<ApiChatRoom[]> {
  return request(withUserId('/chat-rooms'));
}

export async function apiGetChatRoom(id: string): Promise<ApiChatRoom> {
  return request(`/chat-rooms/${id}`);
}

export async function apiCreateChatRoom(name: string, participantIds: string[]): Promise<ApiChatRoom> {
  return request(withUserId('/chat-rooms'), {
    method: 'POST',
    body: JSON.stringify({ name, participantIds }),
  });
}

export async function apiLeaveChatRoom(roomId: string): Promise<void> {
  return request(withUserId(`/chat-rooms/${roomId}/leave`), { method: 'DELETE' });
}

// ── Messages ──

export async function apiFetchMessages(
  roomId: string,
  limit = 100,
  before?: string,
): Promise<Message[]> {
  let path = `/chat-rooms/${roomId}/messages?limit=${limit}`;
  if (before) path += `&before=${before}`;
  return request(path);
}

export async function apiSendMessage(
  roomId: string,
  data: { text: string; type?: string; fileUri?: string; fileName?: string },
): Promise<Message> {
  return request(withUserId(`/chat-rooms/${roomId}/messages`), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Message Search ──

export interface MessageSearchResult {
  chatRoomId: string;
  chatRoomName: string;
  messages: Message[];
}

export async function apiSearchMessages(
  query: string,
  limit = 50,
): Promise<MessageSearchResult[]> {
  return request(withUserId(`/messages/search?q=${encodeURIComponent(query)}&limit=${limit}`));
}

// ── User Registration / Login ──

export async function apiRegisterOrLogin(name: string, phone: string): Promise<User> {
  try {
    const user = await createUser({ name, phone });
    return user;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('409')) {
      // Already registered, find by listing users and matching phone
      const users = await getAllUsers();
      const existing = users.find((u) => u.phone === phone);
      if (existing) return existing;
    }
    throw err;
  }
}
