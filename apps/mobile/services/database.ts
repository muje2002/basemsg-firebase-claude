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

export async function saveChatRooms(rooms: ChatRoom[]): Promise<void> {
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

export async function saveFriends(friends: Friend[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.FRIENDS, JSON.stringify(friends));
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

// Search (local)
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

// Current user persistence
export async function saveCurrentUser(user: { id: string; name: string; phone: string }): Promise<void> {
  await AsyncStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
}

export async function getCurrentUser(): Promise<{ id: string; name: string; phone: string } | null> {
  const data = await AsyncStorage.getItem(KEYS.CURRENT_USER);
  if (!data) return null;
  return JSON.parse(data);
}

export async function clearCurrentUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER);
}
