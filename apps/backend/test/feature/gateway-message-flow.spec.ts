import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '../../src/gateway/chat.gateway';
import { MessagesService } from '../../src/messages/messages.service';

/**
 * Layer 2 Feature Test: Socket Gateway → Message persistence flow
 * Tests ChatGateway + MessagesService interaction.
 */

describe('Feature: Gateway → Message flow', () => {
  let gateway: ChatGateway;
  let messagesService: { create: jest.Mock };

  const savedMessages: any[] = [];

  beforeEach(async () => {
    savedMessages.length = 0;

    const mockMessagesService = {
      create: jest.fn((roomId, senderId, dto) => {
        const msg = {
          id: `msg-${savedMessages.length + 1}`,
          chatRoomId: roomId,
          senderId,
          text: dto.text,
          type: dto.type ?? 'text',
          fileUri: dto.fileUri,
          fileName: dto.fileName,
          createdAt: new Date(),
        };
        savedMessages.push(msg);
        return Promise.resolve(msg);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: MessagesService, useValue: mockMessagesService },
      ],
    }).compile();

    gateway = module.get(ChatGateway);
    messagesService = module.get(MessagesService);

    // Mock server
    const emitFn = jest.fn();
    (gateway as any).server = {
      to: jest.fn().mockReturnValue({ emit: emitFn }),
    };
  });

  const mockSocket = (id: string, userId: string) => ({
    id,
    handshake: { auth: { userId } },
    join: jest.fn(),
    leave: jest.fn(),
  });

  it('should connect, join room, send message, and persist it', async () => {
    const socket = mockSocket('sock-1', 'user-1');

    // 1. Connect
    gateway.handleConnection(socket as any);

    // 2. Join room
    gateway.handleJoinRoom(socket as any, 'room-1');
    expect(socket.join).toHaveBeenCalledWith('room-1');

    // 3. Send message via gateway
    const result = await gateway.handleMessage(socket as any, {
      chatRoomId: 'room-1',
      senderId: 'user-1',
      text: '소켓으로 보낸 메시지!',
    });

    // 4. Verify message was persisted
    expect(messagesService.create).toHaveBeenCalledWith('room-1', 'user-1', {
      text: '소켓으로 보낸 메시지!',
      type: undefined,
      fileUri: undefined,
      fileName: undefined,
    });
    expect(result.text).toBe('소켓으로 보낸 메시지!');
    expect(savedMessages).toHaveLength(1);

    // 5. Verify broadcast
    expect((gateway as any).server.to).toHaveBeenCalledWith('room-1');
  });

  it('should handle multiple users in a room exchanging messages', async () => {
    const sock1 = mockSocket('sock-1', 'user-1');
    const sock2 = mockSocket('sock-2', 'user-2');

    gateway.handleConnection(sock1 as any);
    gateway.handleConnection(sock2 as any);
    gateway.handleJoinRoom(sock1 as any, 'room-1');
    gateway.handleJoinRoom(sock2 as any, 'room-1');

    // User 1 sends
    await gateway.handleMessage(sock1 as any, {
      chatRoomId: 'room-1',
      senderId: 'user-1',
      text: '안녕하세요!',
    });

    // User 2 replies
    await gateway.handleMessage(sock2 as any, {
      chatRoomId: 'room-1',
      senderId: 'user-2',
      text: '반갑습니다!',
    });

    expect(savedMessages).toHaveLength(2);
    expect(savedMessages[0].senderId).toBe('user-1');
    expect(savedMessages[1].senderId).toBe('user-2');
  });

  it('should persist file attachment messages via gateway', async () => {
    const socket = mockSocket('sock-1', 'user-1');
    gateway.handleConnection(socket as any);
    gateway.handleJoinRoom(socket as any, 'room-1');

    await gateway.handleMessage(socket as any, {
      chatRoomId: 'room-1',
      senderId: 'user-1',
      text: '📷 사진',
      type: 'image',
      fileUri: '/uploads/photo.jpg',
      fileName: 'photo.jpg',
    });

    expect(savedMessages).toHaveLength(1);
    expect(savedMessages[0].type).toBe('image');
    expect(savedMessages[0].fileUri).toBe('/uploads/photo.jpg');
  });

  it('should handle disconnect and reconnect', async () => {
    const socket = mockSocket('sock-1', 'user-1');

    gateway.handleConnection(socket as any);
    gateway.handleDisconnect(socket as any);

    // Reconnect
    gateway.handleConnection(socket as any);
    gateway.handleJoinRoom(socket as any, 'room-1');

    const result = await gateway.handleMessage(socket as any, {
      chatRoomId: 'room-1',
      senderId: 'user-1',
      text: '재연결 후 메시지',
    });

    expect(result.text).toBe('재연결 후 메시지');
    expect(savedMessages).toHaveLength(1);
  });
});
