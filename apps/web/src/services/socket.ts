import { io, Socket } from 'socket.io-client';
import type { Message } from '@basemsg/shared';

let socket: Socket | null = null;

export function connectSocket(userId: string): Socket {
  if (socket?.connected) return socket;

  socket = io('/', {
    auth: { userId },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function socketSendMessage(message: {
  chatRoomId: string;
  senderId: string;
  text: string;
  type?: string;
}): void {
  socket?.emit('message:send', message);
}

export function joinRoom(roomId: string): void {
  socket?.emit('room:join', roomId);
}

export function leaveRoom(roomId: string): void {
  socket?.emit('room:leave', roomId);
}

export function onNewMessage(callback: (message: Message) => void): () => void {
  socket?.on('message:receive', callback);
  return () => {
    socket?.off('message:receive', callback);
  };
}
