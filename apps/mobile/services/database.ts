import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatRoom, Message, Friend } from '@basemsg/shared';

const KEYS = {
  CHAT_ROOMS: 'basemsg:chatrooms',
  MESSAGES_PREFIX: 'basemsg:messages:',
  FRIENDS: 'basemsg:friends',
  CURRENT_USER: 'basemsg:currentuser',
};

const MAX_MESSAGES_PER_ROOM = 1000;

// Chat Rooms
export async function getChatRooms(): Promise<ChatRoom[]> {
  const data = await AsyncStorage.getItem(KEYS.CHAT_ROOMS);
  if (!data) return [];
  const rooms: ChatRoom[] = JSON.parse(data);
  return rooms.sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.createdAt;
    const bTime = b.lastMessageAt ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export async function saveChatRoom(room: ChatRoom): Promise<void> {
  const rooms = await getChatRooms();
  const index = rooms.findIndex((r) => r.id === room.id);
  if (index >= 0) {
    rooms[index] = room;
  } else {
    rooms.unshift(room);
  }
  await AsyncStorage.setItem(KEYS.CHAT_ROOMS, JSON.stringify(rooms));
}

export async function deleteChatRoom(roomId: string): Promise<void> {
  const rooms = await getChatRooms();
  const filtered = rooms.filter((r) => r.id !== roomId);
  await AsyncStorage.setItem(KEYS.CHAT_ROOMS, JSON.stringify(filtered));
  await AsyncStorage.removeItem(KEYS.MESSAGES_PREFIX + roomId);
}

// Messages
export async function getMessages(chatRoomId: string): Promise<Message[]> {
  const data = await AsyncStorage.getItem(KEYS.MESSAGES_PREFIX + chatRoomId);
  if (!data) return [];
  return JSON.parse(data);
}

export async function saveMessage(message: Message): Promise<void> {
  const messages = await getMessages(message.chatRoomId);
  messages.push(message);
  // Keep only the most recent messages
  const trimmed = messages.slice(-MAX_MESSAGES_PER_ROOM);
  await AsyncStorage.setItem(
    KEYS.MESSAGES_PREFIX + message.chatRoomId,
    JSON.stringify(trimmed)
  );
  // Update the chat room's last message
  const rooms = await getChatRooms();
  const room = rooms.find((r) => r.id === message.chatRoomId);
  if (room) {
    room.lastMessage = message.text;
    room.lastMessageAt = message.createdAt;
    await saveChatRoom(room);
  }
}

// Friends
export async function getFriends(): Promise<Friend[]> {
  const data = await AsyncStorage.getItem(KEYS.FRIENDS);
  if (!data) return [];
  return JSON.parse(data);
}

export async function addFriend(friend: Friend): Promise<void> {
  const friends = await getFriends();
  if (!friends.find((f) => f.id === friend.id)) {
    friends.push(friend);
    await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify(friends));
  }
}

export async function removeFriends(friendIds: string[]): Promise<void> {
  const friends = await getFriends();
  const filtered = friends.filter((f) => !friendIds.includes(f.id));
  await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify(filtered));
}

// Search
export async function searchChatRooms(query: string): Promise<ChatRoom[]> {
  const rooms = await getChatRooms();
  const lowerQuery = query.toLowerCase();

  // Search by room name
  const nameMatches = rooms.filter((r) =>
    r.name.toLowerCase().includes(lowerQuery)
  );

  // Search by message content
  const messageMatches: ChatRoom[] = [];
  for (const room of rooms) {
    if (nameMatches.find((r) => r.id === room.id)) continue;
    const messages = await getMessages(room.id);
    const hasMatch = messages.some((m) =>
      m.text.toLowerCase().includes(lowerQuery)
    );
    if (hasMatch) {
      messageMatches.push(room);
    }
  }

  return [...nameMatches, ...messageMatches];
}

// Seed mock data for development
export async function seedMockData(): Promise<void> {
  const rooms = await getChatRooms();
  if (rooms.length > 0) return;

  const now = new Date();

  const mockRooms: ChatRoom[] = [
    {
      id: 'room-1',
      name: '프로젝트 팀',
      participants: ['user-1', 'user-2', 'user-3'],
      lastMessage: '내일 회의 시간 확인해주세요!',
      lastMessageAt: new Date(now.getTime() - 5 * 60000).toISOString(),
      unreadCount: 3,
      createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
    },
    {
      id: 'room-2',
      name: '김민수',
      participants: ['user-1', 'user-2'],
      lastMessage: '오늘 점심 같이 먹을래?',
      lastMessageAt: new Date(now.getTime() - 30 * 60000).toISOString(),
      unreadCount: 1,
      createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
    },
    {
      id: 'room-3',
      name: '가족방',
      participants: ['user-1', 'user-4', 'user-5'],
      lastMessage: '주말에 모이자~',
      lastMessageAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      unreadCount: 0,
      createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
    },
    {
      id: 'room-4',
      name: '이지은',
      participants: ['user-1', 'user-6'],
      lastMessage: '감사합니다 :)',
      lastMessageAt: new Date(now.getTime() - 86400000).toISOString(),
      unreadCount: 0,
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
  ];

  const mockMessages: Record<string, Message[]> = {
    'room-1': [
      { id: 'msg-1', chatRoomId: 'room-1', senderId: 'user-2', text: '다들 내일 회의 시간 괜찮으세요?', type: 'text', createdAt: new Date(now.getTime() - 10 * 60000).toISOString() },
      { id: 'msg-2', chatRoomId: 'room-1', senderId: 'user-3', text: '저는 2시 이후로 가능합니다', type: 'text', createdAt: new Date(now.getTime() - 8 * 60000).toISOString() },
      { id: 'msg-3', chatRoomId: 'room-1', senderId: 'user-1', text: '저도 2시 괜찮아요', type: 'text', createdAt: new Date(now.getTime() - 6 * 60000).toISOString() },
      { id: 'msg-4', chatRoomId: 'room-1', senderId: 'user-2', text: '내일 회의 시간 확인해주세요!', type: 'text', createdAt: new Date(now.getTime() - 5 * 60000).toISOString() },
    ],
    'room-2': [
      { id: 'msg-5', chatRoomId: 'room-2', senderId: 'user-1', text: '안녕!', type: 'text', createdAt: new Date(now.getTime() - 60 * 60000).toISOString() },
      { id: 'msg-6', chatRoomId: 'room-2', senderId: 'user-2', text: '오늘 점심 같이 먹을래?', type: 'text', createdAt: new Date(now.getTime() - 30 * 60000).toISOString() },
    ],
    'room-3': [
      { id: 'msg-7', chatRoomId: 'room-3', senderId: 'user-4', text: '주말에 모이자~', type: 'text', createdAt: new Date(now.getTime() - 2 * 3600000).toISOString() },
    ],
    'room-4': [
      { id: 'msg-8', chatRoomId: 'room-4', senderId: 'user-6', text: '어제 보내준 자료 확인했어요', type: 'text', createdAt: new Date(now.getTime() - 2 * 86400000).toISOString() },
      { id: 'msg-9', chatRoomId: 'room-4', senderId: 'user-1', text: '네 확인 감사합니다', type: 'text', createdAt: new Date(now.getTime() - 86400000 - 3600000).toISOString() },
      { id: 'msg-10', chatRoomId: 'room-4', senderId: 'user-6', text: '감사합니다 :)', type: 'text', createdAt: new Date(now.getTime() - 86400000).toISOString() },
    ],
  };

  for (const room of mockRooms) {
    await saveChatRoom(room);
  }

  for (const [roomId, messages] of Object.entries(mockMessages)) {
    await AsyncStorage.setItem(
      KEYS.MESSAGES_PREFIX + roomId,
      JSON.stringify(messages)
    );
  }

  const mockFriends: Friend[] = [
    { id: 'friend-1', userId: 'user-2', name: '김민수', phone: '010-1234-5678', addedAt: new Date(now.getTime() - 14 * 86400000).toISOString() },
    { id: 'friend-2', userId: 'user-3', name: '박서연', phone: '010-2345-6789', addedAt: new Date(now.getTime() - 10 * 86400000).toISOString() },
    { id: 'friend-3', userId: 'user-4', name: '엄마', phone: '010-3456-7890', addedAt: new Date(now.getTime() - 30 * 86400000).toISOString() },
    { id: 'friend-4', userId: 'user-5', name: '아빠', phone: '010-4567-8901', addedAt: new Date(now.getTime() - 30 * 86400000).toISOString() },
    { id: 'friend-5', userId: 'user-6', name: '이지은', phone: '010-5678-9012', addedAt: new Date(now.getTime() - 3 * 86400000).toISOString() },
  ];

  await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify(mockFriends));
}
