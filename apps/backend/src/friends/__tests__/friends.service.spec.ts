import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { FriendsService } from '../friends.service';
import { Friend } from '../friend.entity';
import { User } from '../../users/user.entity';

faker.seed(42);

const mockFriendRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

const mockUserRepo = () => ({
  findOne: jest.fn(),
});

describe('FriendsService', () => {
  let service: FriendsService;
  let friendRepo: ReturnType<typeof mockFriendRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: getRepositoryToken(Friend), useFactory: mockFriendRepo },
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
      ],
    }).compile();

    service = module.get(FriendsService);
    friendRepo = module.get(getRepositoryToken(Friend));
    userRepo = module.get(getRepositoryToken(User));
  });

  const makeUser = (id: string, name: string) => ({
    id,
    name,
    phone: `010-${id}`,
    createdAt: new Date(),
  });

  // ── 1. Happy Path ──
  describe('addFriend - happy path', () => {
    it('should add a friend relationship', async () => {
      const userA = makeUser('a', 'UserA');
      const userB = makeUser('b', 'UserB');

      userRepo.findOne.mockImplementation(({ where: { id } }: any) =>
        id === 'a' ? userA : id === 'b' ? userB : null,
      );
      friendRepo.findOne.mockResolvedValue(null);
      friendRepo.create.mockReturnValue({ user: userA, friend: userB });
      friendRepo.save.mockResolvedValue({ id: 'f1', user: userA, friend: userB });

      const result = await service.addFriend('a', 'b');
      expect(result.friend).toBe(userB);
    });
  });

  describe('getFriends - happy path', () => {
    it('should return list of friends', async () => {
      const friends = [
        { friend: makeUser('b', 'B') },
        { friend: makeUser('c', 'C') },
      ];
      friendRepo.find.mockResolvedValue(friends);

      const result = await service.getFriends('a');
      expect(result).toHaveLength(2);
    });
  });

  describe('removeFriend - happy path', () => {
    it('should remove a friend relationship', async () => {
      friendRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.removeFriend('a', 'b')).resolves.toBeUndefined();
    });
  });

  // ── 2. Boundary values ──
  describe('getFriends - boundary values', () => {
    it('should return empty array when no friends', async () => {
      friendRepo.find.mockResolvedValue([]);

      const result = await service.getFriends('a');
      expect(result).toEqual([]);
    });
  });

  // ── 3. Corner cases ──
  describe('addFriend - corner cases', () => {
    it('should handle users with emoji names', async () => {
      const userA = makeUser('a', '유저🎉');
      const userB = makeUser('b', '친구😊');

      userRepo.findOne.mockImplementation(({ where: { id } }: any) =>
        id === 'a' ? userA : userB,
      );
      friendRepo.findOne.mockResolvedValue(null);
      friendRepo.create.mockReturnValue({ user: userA, friend: userB });
      friendRepo.save.mockResolvedValue({ id: 'f1', user: userA, friend: userB });

      const result = await service.addFriend('a', 'b');
      expect(result.friend.name).toContain('😊');
    });
  });

  // ── 4. Invalid input ──
  describe('addFriend - invalid input', () => {
    it('should throw BadRequestException when adding yourself', async () => {
      await expect(service.addFriend('a', 'a')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.addFriend('a', 'b')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate friendship', async () => {
      const userA = makeUser('a', 'A');
      const userB = makeUser('b', 'B');
      userRepo.findOne.mockImplementation(({ where: { id } }: any) =>
        id === 'a' ? userA : userB,
      );
      friendRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.addFriend('a', 'b')).rejects.toThrow(ConflictException);
    });
  });

  describe('removeFriend - invalid input', () => {
    it('should throw NotFoundException when relationship not found', async () => {
      friendRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.removeFriend('a', 'b')).rejects.toThrow(NotFoundException);
    });
  });

  // ── 5. Random input ──
  describe('addFriend - random input', () => {
    it.each([1, 2, 3])('should handle random users (iteration %i)', async (i) => {
      const userA = makeUser(`rand-a-${i}`, faker.person.fullName());
      const userB = makeUser(`rand-b-${i}`, faker.person.fullName());

      userRepo.findOne.mockImplementation(({ where: { id } }: any) =>
        id === userA.id ? userA : userB,
      );
      friendRepo.findOne.mockResolvedValue(null);
      friendRepo.create.mockReturnValue({ user: userA, friend: userB });
      friendRepo.save.mockResolvedValue({ id: `f-${i}`, user: userA, friend: userB });

      const result = await service.addFriend(userA.id, userB.id);
      expect(result.friend.name).toBe(userB.name);
    });
  });

  // ── 6. Concurrency ──
  describe('addFriend - concurrency', () => {
    it('should handle concurrent friend additions', async () => {
      const userA = makeUser('a', 'A');
      const friendUsers = Array.from({ length: 5 }, (_, i) => makeUser(`f${i}`, `F${i}`));

      userRepo.findOne.mockImplementation(({ where: { id } }: any) => {
        if (id === 'a') return userA;
        return friendUsers.find((u) => u.id === id) ?? null;
      });
      friendRepo.findOne.mockResolvedValue(null);
      friendRepo.create.mockImplementation((data) => data);
      friendRepo.save.mockImplementation((data) => Promise.resolve({ id: `f-${Math.random()}`, ...data }));

      const results = await Promise.all(
        friendUsers.map((fu) => service.addFriend('a', fu.id)),
      );
      expect(results).toHaveLength(5);
    });
  });
});
