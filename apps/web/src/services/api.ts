import type { ChatRoom, Message, User, Friend } from '@basemsg/shared';
import { BASE_URL } from './env';

let currentUserId: string | null = null;

export function setCurrentUserId(id: string) {
  currentUserId = id;
}

export function getCurrentUserId(): string {
  if (!currentUserId) {
    throw new Error('User ID not set');
  }
  return currentUserId;
}

// Auth token getter — set from App.tsx after Clerk login
let globalGetToken: () => Promise<string | null> = async () => null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  globalGetToken = getter;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await globalGetToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Users (sync uses ClerkAuthGuard — no userId needed)
export const syncUser = (data: { name: string; phone: string }) =>
  request<User>('/users/sync', { method: 'POST', body: JSON.stringify(data) });
export const createUser = (data: { name: string; phone: string }) =>
  request<User>('/users', { method: 'POST', body: JSON.stringify(data) });
export const getUser = (id: string) => request<User>(`/users/${id}`);
export const getAllUsers = () => request<User[]>('/users');

// Friends — userId is now extracted from Bearer token by ClerkAuthGuard
export const fetchFriends = () => request<Friend[]>('/friends');
export const addFriend = (friendId: string) =>
  request<Friend>('/friends', { method: 'POST', body: JSON.stringify({ friendId }) });
export const removeFriend = (friendId: string) =>
  request<void>(`/friends/${friendId}`, { method: 'DELETE' });

// Chat Rooms
export interface ApiChatRoom {
  id: string;
  name: string;
  createdAt: string;
  participants: Array<{ id: string; user: User; joinedAt: string }>;
}

export const fetchChatRooms = () => request<ApiChatRoom[]>('/chat-rooms');
export const getChatRoom = (id: string) => request<ApiChatRoom>(`/chat-rooms/${id}`);
export const createChatRoom = (name: string, participantIds: string[]) =>
  request<ApiChatRoom>('/chat-rooms', { method: 'POST', body: JSON.stringify({ name, participantIds }) });
export const leaveChatRoom = (roomId: string) =>
  request<void>(`/chat-rooms/${roomId}/leave`, { method: 'DELETE' });

// Messages
export const fetchMessages = (roomId: string, limit = 100, before?: string) => {
  let path = `/chat-rooms/${roomId}/messages?limit=${limit}`;
  if (before) path += `&before=${before}`;
  return request<Message[]>(path);
};
export const sendMessage = (roomId: string, data: { text: string; type?: string }) =>
  request<Message>(`/chat-rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify(data) });
