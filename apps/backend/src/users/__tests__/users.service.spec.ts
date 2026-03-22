import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { UsersService } from '../users.service';
import { User } from '../user.entity';
import { PendingFriend } from '../../friends/pending-friend.entity';
import { Friend } from '../../friends/friend.entity';

faker.seed(42);

const mockUserRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockPendingFriendRepo = () => ({
  find: jest.fn().mockResolvedValue([]),
  delete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  }),
});

const mockFriendRepo = () => ({
  findOne: jest.fn().mockResolvedValue(null),
  save: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: getRepositoryToken(PendingFriend), useFactory: mockPendingFriendRepo },
        { provide: getRepositoryToken(Friend), useFactory: mockFriendRepo },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  // ── 1. Happy Path ──
  describe('create - happy path', () => {
    it('should create a user with valid input', async () => {
      const dto = { name: '김민수', phone: '010-1234-5678' };
      const user = { id: 'uuid-1', ...dto, nameChosung: 'ㄱㅁㅅ', createdAt: new Date() };

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.create(dto);
      expect(result.name).toBe('김민수');
      expect(result.phone).toBe('010-1234-5678');
      expect(repo.save).toHaveBeenCalledWith(user);
    });
  });

  describe('findAll - happy path', () => {
    it('should return all users', async () => {
      const users = [
        { id: '1', name: 'A', phone: '010-0000-0001', createdAt: new Date() },
        { id: '2', name: 'B', phone: '010-0000-0002', createdAt: new Date() },
      ];
      repo.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne - happy path', () => {
    it('should return a user by id', async () => {
      const user = { id: 'uuid-1', name: '김민수', phone: '010-1234-5678' };
      repo.findOne.mockResolvedValue(user);

      const result = await service.findOne('uuid-1');
      expect(result.id).toBe('uuid-1');
    });
  });

  // ── 2. Boundary values ──
  describe('create - boundary values', () => {
    it('should create user with max length name (100 chars)', async () => {
      const dto = { name: 'A'.repeat(100), phone: '010-0000-0000' };
      const user = { id: 'uuid', ...dto, createdAt: new Date() };

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.create(dto);
      expect(result.name).toHaveLength(100);
    });

    it('should create user with single character name', async () => {
      const dto = { name: 'A', phone: '010-0000-0001' };
      const user = { id: 'uuid', ...dto, createdAt: new Date() };

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.create(dto);
      expect(result.name).toHaveLength(1);
    });
  });

  // ── 3. Corner cases (emoji, unicode, special chars) ──
  describe('create - corner cases', () => {
    it('should handle emoji in name', async () => {
      const dto = { name: '테스트 😀🎉', phone: '010-9999-0001' };
      const user = { id: 'uuid', ...dto, createdAt: new Date() };

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.create(dto);
      expect(result.name).toContain('😀');
    });

    it('should handle RTL text in name', async () => {
      const dto = { name: 'مرحبا', phone: '010-9999-0002' };
      const user = { id: 'uuid', ...dto, createdAt: new Date() };

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.create(dto);
      expect(result.name).toBe('مرحبا');
    });

    it('should handle special characters in name', async () => {
      const dto = { name: "O'Brien-Smith", phone: '010-9999-0003' };
      const user = { id: 'uuid', ...dto, createdAt: new Date() };

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.create(dto);
      expect(result.name).toBe("O'Brien-Smith");
    });
  });

  // ── 4. Invalid input ──
  describe('create - invalid input', () => {
    it('should throw ConflictException for duplicate phone', async () => {
      const dto = { name: '김민수', phone: '010-1234-5678' };
      repo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne - invalid input', () => {
    it('should throw NotFoundException for non-existent user', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── 5. Random input (faker, 3 iterations) ──
  describe('create - random input', () => {
    it.each([1, 2, 3])('should handle random user data (iteration %i)', async (i) => {
      const dto = {
        name: faker.person.fullName(),
        phone: faker.phone.number(),
      };
      const user = { id: `uuid-rand-${i}`, ...dto, createdAt: new Date() };

      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.create(dto);
      expect(result.name).toBe(dto.name);
      expect(result.phone).toBe(dto.phone);
    });
  });

  // ── 6. Concurrency ──
  describe('create - concurrency', () => {
    it('should handle concurrent user creation', async () => {
      const users = Array.from({ length: 5 }, (_, i) => ({
        name: `User${i}`,
        phone: `010-0000-${String(i).padStart(4, '0')}`,
      }));

      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((dto) => ({ id: `uuid-${dto.phone}`, ...dto, createdAt: new Date() }));
      repo.save.mockImplementation((user) => Promise.resolve(user));

      const results = await Promise.all(users.map((dto) => service.create(dto)));
      expect(results).toHaveLength(5);
      const phones = results.map((r) => r.phone);
      expect(new Set(phones).size).toBe(5);
    });
  });
});
