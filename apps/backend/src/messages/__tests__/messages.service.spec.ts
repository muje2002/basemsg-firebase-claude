import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { MessagesService } from '../messages.service';
import { Message } from '../message.entity';

faker.seed(42);

const mockMessageRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('MessagesService', () => {
  let service: MessagesService;
  let repo: ReturnType<typeof mockMessageRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useFactory: mockMessageRepo },
      ],
    }).compile();

    service = module.get(MessagesService);
    repo = module.get(getRepositoryToken(Message));
  });

  // ── 1. Happy Path ──
  describe('create - happy path', () => {
    it('should create a text message', async () => {
      const msg = {
        id: 'm1',
        chatRoomId: 'r1',
        senderId: 'u1',
        text: '안녕하세요!',
        type: 'text' as const,
        createdAt: new Date(),
      };
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);

      const result = await service.create('r1', 'u1', { text: '안녕하세요!' });
      expect(result.text).toBe('안녕하세요!');
      expect(result.type).toBe('text');
    });
  });

  describe('findByRoom - happy path', () => {
    it('should return messages for a room', async () => {
      const messages = [
        { id: 'm1', text: 'Hello', createdAt: new Date() },
        { id: 'm2', text: 'World', createdAt: new Date() },
      ];
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(messages),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByRoom('r1');
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne - happy path', () => {
    it('should return a message by id', async () => {
      repo.findOne.mockResolvedValue({ id: 'm1', text: 'Test' });
      const result = await service.findOne('m1');
      expect(result.text).toBe('Test');
    });
  });

  // ── 2. Boundary values ──
  describe('create - boundary values', () => {
    it('should handle empty-ish text (single char)', async () => {
      const msg = { id: 'm', chatRoomId: 'r1', senderId: 'u1', text: 'a', type: 'text' as const };
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);

      const result = await service.create('r1', 'u1', { text: 'a' });
      expect(result.text).toBe('a');
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(10000);
      const msg = { id: 'm', chatRoomId: 'r1', senderId: 'u1', text: longText, type: 'text' as const };
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);

      const result = await service.create('r1', 'u1', { text: longText });
      expect(result.text).toHaveLength(10000);
    });
  });

  describe('findByRoom - boundary values', () => {
    it('should return empty array for room with no messages', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByRoom('r1');
      expect(result).toEqual([]);
    });
  });

  // ── 3. Corner cases ──
  describe('create - corner cases', () => {
    it('should handle emoji messages', async () => {
      const text = '😀🎉🚀💬';
      const msg = { id: 'm', chatRoomId: 'r1', senderId: 'u1', text, type: 'emoji' as const };
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);

      const result = await service.create('r1', 'u1', { text, type: 'emoji' });
      expect(result.text).toBe(text);
      expect(result.type).toBe('emoji');
    });

    it('should handle message with file attachment', async () => {
      const msg = {
        id: 'm', chatRoomId: 'r1', senderId: 'u1',
        text: 'file', type: 'file' as const,
        fileUri: '/uploads/doc.pdf', fileName: 'doc.pdf',
      };
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);

      const result = await service.create('r1', 'u1', {
        text: 'file', type: 'file', fileUri: '/uploads/doc.pdf', fileName: 'doc.pdf',
      });
      expect(result.fileUri).toBe('/uploads/doc.pdf');
    });

    it('should handle unicode and special chars', async () => {
      const text = 'مرحبا שלום <script>alert("xss")</script>';
      const msg = { id: 'm', chatRoomId: 'r1', senderId: 'u1', text, type: 'text' as const };
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);

      const result = await service.create('r1', 'u1', { text });
      expect(result.text).toBe(text);
    });
  });

  // ── 4. Invalid input ──
  describe('findOne - invalid input', () => {
    it('should throw NotFoundException for non-existent message', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── 5. Random input ──
  describe('create - random input', () => {
    it.each([1, 2, 3])('should handle random message data (iteration %i)', async (i) => {
      const text = faker.lorem.paragraph();
      const msg = { id: `m-${i}`, chatRoomId: 'r1', senderId: 'u1', text, type: 'text' as const };
      repo.create.mockReturnValue(msg);
      repo.save.mockResolvedValue(msg);

      const result = await service.create('r1', 'u1', { text });
      expect(result.text).toBe(text);
    });
  });

  // ── 6. Concurrency ──
  describe('create - concurrency', () => {
    it('should handle concurrent message creation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const msg = { id: `m-${i}`, chatRoomId: 'r1', senderId: 'u1', text: `Msg ${i}`, type: 'text' as const };
        repo.create.mockReturnValue(msg);
        repo.save.mockResolvedValue(msg);
        return service.create('r1', 'u1', { text: `Msg ${i}` });
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
    });
  });
});
