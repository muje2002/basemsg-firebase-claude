import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '../../src/gateway/chat.gateway';
import { MessagesService } from '../../src/messages/messages.service';

/**
 * Layer 2 Feature Test: Socket Gateway → Real-time relay flow
 * Gateway relays messages to other clients (REST API handles persistence).
 */

describe('Feature: Gateway → Message relay flow', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const mockMessagesService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: MessagesService, useValue: mockMessagesService },
      ],
    }).compile();

    gateway = module.get(ChatGateway);

    // Mock server (not used in relay-only mode, but required by gateway)
    (gateway as any).server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };
  });

  const mockSocket = (id: string, userId: string) => ({
    id,
    handshake: { auth: { userId } },
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  });

  it('should connect, join room, and relay message to other clients', () => {
    const socket = mockSocket('sock-1', 'user-1');

    // 1. Connect
    gateway.handleConnection(socket as any);

    // 2. Join room
    gateway.handleJoinRoom(socket as any, 'room-1');
    expect(socket.join).toHaveBeenCalledWith('room-1');

    // 3. Send message via gateway
    const payload = {
      chatRoomId: 'room-1',
      senderId: 'user-1',
      text: '소켓으로 보낸 메시지!',
    };
    gateway.handleMessage(socket as any, payload);

    // 4. Verify broadcast to room (excluding sender)
    expect(socket.to).toHaveBeenCalledWith('room-1');
  });

  it('should handle multiple users in a room exchanging messages', () => {
    const sock1 = mockSocket('sock-1', 'user-1');
    const sock2 = mockSocket('sock-2', 'user-2');

    gateway.handleConnection(sock1 as any);
    gateway.handleConnection(sock2 as any);
    gateway.handleJoinRoom(sock1 as any, 'room-1');
    gateway.handleJoinRoom(sock2 as any, 'room-1');

    // User 1 sends
    gateway.handleMessage(sock1 as any, {
      chatRoomId: 'room-1',
      senderId: 'user-1',
      text: '안녕하세요!',
    });
    expect(sock1.to).toHaveBeenCalledWith('room-1');

    // User 2 replies
    gateway.handleMessage(sock2 as any, {
      chatRoomId: 'room-1',
      senderId: 'user-2',
      text: '반갑습니다!',
    });
    expect(sock2.to).toHaveBeenCalledWith('room-1');
  });

  it('should relay file attachment messages', () => {
    const socket = mockSocket('sock-1', 'user-1');
    gateway.handleConnection(socket as any);
    gateway.handleJoinRoom(socket as any, 'room-1');

    const payload = {
      chatRoomId: 'room-1',
      senderId: 'user-1',
      text: '📷 사진',
      type: 'image' as const,
      fileUri: '/uploads/photo.jpg',
      fileName: 'photo.jpg',
    };
    gateway.handleMessage(socket as any, payload);

    expect(socket.to).toHaveBeenCalledWith('room-1');
  });

  it('should handle disconnect and reconnect', () => {
    const socket = mockSocket('sock-1', 'user-1');

    gateway.handleConnection(socket as any);
    gateway.handleDisconnect(socket as any);

    // Reconnect
    gateway.handleConnection(socket as any);
    gateway.handleJoinRoom(socket as any, 'room-1');

    gateway.handleMessage(socket as any, {
      chatRoomId: 'room-1',
      senderId: 'user-1',
      text: '재연결 후 메시지',
    });

    expect(socket.to).toHaveBeenCalledWith('room-1');
  });
});
