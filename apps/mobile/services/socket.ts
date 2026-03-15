import { io, Socket } from 'socket.io-client';
import type { Message } from '@basemsg/shared';

const SERVER_URL = 'http://localhost:3000';

let socket: Socket | null = null;

export function connectSocket(userId: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SERVER_URL, {
    auth: { userId },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.log('[Socket] Connection error:', error.message);
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

export function sendMessage(message: Message): void {
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
