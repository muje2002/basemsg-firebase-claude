export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  text: string;
  type: 'text' | 'image' | 'file' | 'video' | 'emoji';
  fileUri?: string;
  fileName?: string;
  createdAt: string;
}
