import { faker } from '@faker-js/faker';

faker.seed(42);

// Mock socket.io-client
const mockSocket = {
  connected: false,
  id: 'mock-socket-id',
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

import {
  connectSocket,
  disconnectSocket,
  getSocket,
  sendMessage,
  joinRoom,
  leaveRoom,
  onNewMessage,
} from '../socket';
import type { Message } from '@basemsg/shared';

beforeEach(() => {
  jest.clearAllMocks();
  mockSocket.connected = false;
  disconnectSocket();
});

// ── 1. Happy Path ──
describe('Socket - happy path', () => {
  it('connectSocket should create a connection', () => {
    const socket = connectSocket('user-1');
    expect(socket).toBeDefined();
    expect(socket.on).toBeDefined();
  });

  it('getSocket should return the socket after connect', () => {
    connectSocket('user-1');
    const socket = getSocket();
    expect(socket).not.toBeNull();
  });

  it('disconnectSocket should clean up', () => {
    connectSocket('user-1');
    disconnectSocket();
    expect(getSocket()).toBeNull();
  });

  it('sendMessage should emit message:send', () => {
    connectSocket('user-1');
    const msg: Message = {
      id: 'm1',
      chatRoomId: 'r1',
      senderId: 'user-1',
      text: '안녕',
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    sendMessage(msg);
    expect(mockSocket.emit).toHaveBeenCalledWith('message:send', msg);
  });

  it('joinRoom should emit room:join', () => {
    connectSocket('user-1');
    joinRoom('room-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('room:join', 'room-1');
  });

  it('leaveRoom should emit room:leave', () => {
    connectSocket('user-1');
    leaveRoom('room-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('room:leave', 'room-1');
  });

  it('onNewMessage should register and return cleanup', () => {
    connectSocket('user-1');
    const callback = jest.fn();
    const cleanup = onNewMessage(callback);
    expect(mockSocket.on).toHaveBeenCalledWith('message:receive', callback);
    cleanup();
    expect(mockSocket.off).toHaveBeenCalledWith('message:receive', callback);
  });
});

// ── 2. Boundary values ──
describe('Socket - boundary values', () => {
  it('getSocket returns null when not connected', () => {
    expect(getSocket()).toBeNull();
  });

  it('sendMessage does nothing when no socket', () => {
    sendMessage({ id: 'm1', chatRoomId: 'r1', senderId: 'u1', text: 'test', type: 'text', createdAt: '' });
    // Should not throw
  });
});

// ── 3. Corner cases ──
describe('Socket - corner cases', () => {
  it('should handle emoji in message', () => {
    connectSocket('user-1');
    const msg: Message = {
      id: 'm1',
      chatRoomId: 'r1',
      senderId: 'user-1',
      text: '😀🎉🚀',
      type: 'emoji',
      createdAt: new Date().toISOString(),
    };
    sendMessage(msg);
    expect(mockSocket.emit).toHaveBeenCalledWith('message:send', expect.objectContaining({ text: '😀🎉🚀' }));
  });

  it('should handle reconnect (connected=true)', () => {
    mockSocket.connected = true;
    const socket = connectSocket('user-1');
    expect(socket).toBe(mockSocket);
  });
});

// ── 4. Invalid input ──
describe('Socket - invalid input', () => {
  it('joinRoom with empty string should not throw', () => {
    connectSocket('user-1');
    expect(() => joinRoom('')).not.toThrow();
  });

  it('disconnectSocket called twice should not throw', () => {
    connectSocket('user-1');
    disconnectSocket();
    expect(() => disconnectSocket()).not.toThrow();
  });
});

// ── 5. Random input ──
describe('Socket - random input', () => {
  it.each([1, 2, 3])('should handle random message (iteration %i)', (i) => {
    connectSocket(`user-${i}`);
    const msg: Message = {
      id: `m-${i}`,
      chatRoomId: faker.string.uuid(),
      senderId: `user-${i}`,
      text: faker.lorem.sentence(),
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    sendMessage(msg);
    expect(mockSocket.emit).toHaveBeenCalledWith('message:send', msg);
  });
});

// ── 6. Concurrency ──
describe('Socket - concurrency', () => {
  it('should handle multiple rapid sends', () => {
    connectSocket('user-1');
    const messages = Array.from({ length: 10 }, (_, i) => ({
      id: `m-${i}`,
      chatRoomId: 'r1',
      senderId: 'user-1',
      text: `Msg ${i}`,
      type: 'text' as const,
      createdAt: new Date().toISOString(),
    }));
    messages.forEach((m) => sendMessage(m));
    expect(mockSocket.emit).toHaveBeenCalledTimes(10);
  });
});
