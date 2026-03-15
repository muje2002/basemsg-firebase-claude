import type { ChatRoom, Message, User, Friend } from '@basemsg/shared';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

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
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
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
