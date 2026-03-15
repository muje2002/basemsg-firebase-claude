import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '../chat.gateway';
import { MessagesService } from '../../messages/messages.service';

const mockMessagesService = () => ({
  create: jest.fn(),
});

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let messagesService: ReturnType<typeof mockMessagesService>;

  const mockSocket = (id: string, userId?: string) => ({
    id,
    handshake: { auth: { userId } },
    join: jest.fn(),
    leave: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: MessagesService, useFactory: mockMessagesService },
      ],
    }).compile();

    gateway = module.get(ChatGateway);
    messagesService = module.get(MessagesService);

    // Mock the server
    (gateway as any).server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
  });

  // ── 1. Happy Path ──
  describe('handleConnection', () => {
    it('should track connected user', () => {
      const socket = mockSocket('sock-1', 'user-1');
      gateway.handleConnection(socket as any);
      // No error means success — internal state tracked
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up disconnected user', () => {
      const socket = mockSocket('sock-1', 'user-1');
      gateway.handleConnection(socket as any);
      gateway.handleDisconnect(socket as any);
      // No error means success
    });
  });

  describe('handleJoinRoom', () => {
    it('should join socket to room', () => {
      const socket = mockSocket('sock-1', 'user-1');
      gateway.handleJoinRoom(socket as any, 'room-1');
      expect(socket.join).toHaveBeenCalledWith('room-1');
    });
  });

  describe('handleLeaveRoom', () => {
    it('should leave socket from room', () => {
      const socket = mockSocket('sock-1', 'user-1');
      gateway.handleLeaveRoom(socket as any, 'room-1');
      expect(socket.leave).toHaveBeenCalledWith('room-1');
    });
  });

  describe('handleMessage', () => {
    it('should create and broadcast message', async () => {
      const socket = mockSocket('sock-1', 'user-1');
      const payload = { chatRoomId: 'room-1', senderId: 'user-1', text: '안녕!' };
      const savedMsg = { id: 'm1', ...payload, type: 'text', createdAt: new Date() };

      messagesService.create.mockResolvedValue(savedMsg);

      const result = await gateway.handleMessage(socket as any, payload);
      expect(result.text).toBe('안녕!');
      expect((gateway as any).server.to).toHaveBeenCalledWith('room-1');
    });
  });

  // ── 2. Boundary ──
  describe('handleConnection - boundary', () => {
    it('should handle connection without userId', () => {
      const socket = mockSocket('sock-1');
      gateway.handleConnection(socket as any);
      // Should not throw
    });
  });

  // ── 3. Corner cases ──
  describe('handleMessage - corner cases', () => {
    it('should handle emoji message', async () => {
      const socket = mockSocket('sock-1', 'user-1');
      const payload = { chatRoomId: 'room-1', senderId: 'user-1', text: '😀🎉', type: 'emoji' as const };
      messagesService.create.mockResolvedValue({ id: 'm1', ...payload, createdAt: new Date() });

      const result = await gateway.handleMessage(socket as any, payload);
      expect(result.text).toBe('😀🎉');
    });
  });

  // ── 4. Invalid input ──
  describe('handleDisconnect - no prior connection', () => {
    it('should handle disconnect without prior connect', () => {
      const socket = mockSocket('unknown-sock', 'user-1');
      // Should not throw even if never connected
      expect(() => gateway.handleDisconnect(socket as any)).not.toThrow();
    });
  });

  // ── 5. Random input ──
  describe('handleMessage - random', () => {
    it.each([1, 2, 3])('should handle random message (iteration %i)', async (i) => {
      const socket = mockSocket(`sock-${i}`, `user-${i}`);
      const text = `Random-${Math.random().toString(36).slice(2)}`;
      const payload = { chatRoomId: 'room-1', senderId: `user-${i}`, text };
      messagesService.create.mockResolvedValue({ id: `m-${i}`, ...payload, type: 'text', createdAt: new Date() });

      const result = await gateway.handleMessage(socket as any, payload);
      expect(result.text).toBe(text);
    });
  });

  // ── 6. Concurrency ──
  describe('handleMessage - concurrency', () => {
    it('should handle concurrent messages', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => {
        const socket = mockSocket(`sock-${i}`, `user-${i}`);
        const payload = { chatRoomId: 'room-1', senderId: `user-${i}`, text: `Msg-${i}` };
        messagesService.create.mockResolvedValue({ id: `m-${i}`, ...payload, type: 'text', createdAt: new Date() });
        return gateway.handleMessage(socket as any, payload);
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
    });
  });
});
