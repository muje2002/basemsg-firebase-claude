import type { ChatRoom, Message, User, Friend } from '@basemsg/shared';

const BASE_URL = '/api';

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
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
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}userId=${userId}`;
}

// Users
export const createUser = (data: { name: string; phone: string }) =>
  request<User>('/users', { method: 'POST', body: JSON.stringify(data) });
export const getUser = (id: string) => request<User>(`/users/${id}`);
export const getAllUsers = () => request<User[]>('/users');

// Friends
export const fetchFriends = () => request<Friend[]>(withUserId('/friends'));
export const addFriend = (friendId: string) =>
  request<Friend>(withUserId('/friends'), { method: 'POST', body: JSON.stringify({ friendId }) });
export const removeFriend = (friendId: string) =>
  request<void>(withUserId(`/friends/${friendId}`), { method: 'DELETE' });

// Chat Rooms
export interface ApiChatRoom {
  id: string;
  name: string;
  createdAt: string;
  participants: Array<{ id: string; user: User; joinedAt: string }>;
}

export const fetchChatRooms = () => request<ApiChatRoom[]>(withUserId('/chat-rooms'));
export const getChatRoom = (id: string) => request<ApiChatRoom>(`/chat-rooms/${id}`);
export const createChatRoom = (name: string, participantIds: string[]) =>
  request<ApiChatRoom>(withUserId('/chat-rooms'), { method: 'POST', body: JSON.stringify({ name, participantIds }) });
export const leaveChatRoom = (roomId: string) =>
  request<void>(withUserId(`/chat-rooms/${roomId}/leave`), { method: 'DELETE' });

// Messages
export const fetchMessages = (roomId: string, limit = 100, before?: string) => {
  let path = `/chat-rooms/${roomId}/messages?limit=${limit}`;
  if (before) path += `&before=${before}`;
  return request<Message[]>(path);
};
export const sendMessage = (roomId: string, data: { text: string; type?: string }) =>
  request<Message>(withUserId(`/chat-rooms/${roomId}/messages`), { method: 'POST', body: JSON.stringify(data) });
