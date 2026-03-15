import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../src/users/users.service';
import { FriendsService } from '../../src/friends/friends.service';
import { User } from '../../src/users/user.entity';
import { Friend } from '../../src/friends/friend.entity';

/**
 * Layer 2 Feature Test: User Registration → Friend Management flow
 * Tests UsersService + FriendsService interaction with shared mock repositories.
 */

// In-memory store simulating DB
let usersStore: User[] = [];
let friendsStore: Friend[] = [];
let idCounter = 0;

function createMockUserRepo(): Partial<Repository<User>> {
  return {
    create: jest.fn((dto: Partial<User>) => ({
      id: `user-${++idCounter}`,
      createdAt: new Date(),
      ...dto,
    })) as any,
    save: jest.fn((user: User) => {
      const existing = usersStore.findIndex((u) => u.id === user.id);
      if (existing >= 0) usersStore[existing] = user;
      else usersStore.push(user);
      return Promise.resolve(user);
    }) as any,
    find: jest.fn(() => Promise.resolve([...usersStore])) as any,
    findOne: jest.fn(({ where }: any) => {
      if (where.id) return Promise.resolve(usersStore.find((u) => u.id === where.id) ?? null);
      if (where.phone) return Promise.resolve(usersStore.find((u) => u.phone === where.phone) ?? null);
      return Promise.resolve(null);
    }) as any,
  };
}

function createMockFriendRepo(): Partial<Repository<Friend>> {
  return {
    create: jest.fn((data: any) => ({
      id: `friend-${++idCounter}`,
      addedAt: new Date(),
      ...data,
    })) as any,
    save: jest.fn((friend: any) => {
      friendsStore.push(friend);
      return Promise.resolve(friend);
    }) as any,
    find: jest.fn(({ where }: any) => {
      const userId = where?.user?.id;
      return Promise.resolve(
        friendsStore
          .filter((f: any) => f.user?.id === userId)
          .map((f: any) => ({ ...f })),
      );
    }) as any,
    findOne: jest.fn(({ where }: any) => {
      const match = friendsStore.find(
        (f: any) => f.user?.id === where?.user?.id && f.friend?.id === where?.friend?.id,
      );
      return Promise.resolve(match ?? null);
    }) as any,
    delete: jest.fn(({ user, friend }: any) => {
      const before = friendsStore.length;
      friendsStore = friendsStore.filter(
        (f: any) => !(f.user?.id === user?.id && f.friend?.id === friend?.id),
      );
      return Promise.resolve({ affected: before - friendsStore.length });
    }) as any,
  };
}

describe('Feature: User → Friend flow', () => {
  let usersService: UsersService;
  let friendsService: FriendsService;

  beforeEach(async () => {
    usersStore = [];
    friendsStore = [];
    idCounter = 0;

    const mockUserRepo = createMockUserRepo();
    const mockFriendRepo = createMockFriendRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        FriendsService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Friend), useValue: mockFriendRepo },
      ],
    }).compile();

    usersService = module.get(UsersService);
    friendsService = module.get(FriendsService);
  });

  it('should register two users and add them as friends', async () => {
    // 1. Register users
    const alice = await usersService.create({ name: '앨리스', phone: '010-1111-1111' });
    const bob = await usersService.create({ name: '밥', phone: '010-2222-2222' });

    expect(alice.id).toBeDefined();
    expect(bob.id).toBeDefined();

    // 2. Add friend relationship
    const friendship = await friendsService.addFriend(alice.id, bob.id);
    expect(friendship.friend).toBeDefined();

    // 3. Verify friend list
    const friends = await friendsService.getFriends(alice.id);
    expect(friends).toHaveLength(1);
    expect(friends[0].id).toBe(bob.id);
  });

  it('should register, add friend, then remove friend', async () => {
    const alice = await usersService.create({ name: '앨리스', phone: '010-3333-3333' });
    const bob = await usersService.create({ name: '밥', phone: '010-4444-4444' });

    await friendsService.addFriend(alice.id, bob.id);

    // Verify exists
    let friends = await friendsService.getFriends(alice.id);
    expect(friends).toHaveLength(1);

    // Remove
    await friendsService.removeFriend(alice.id, bob.id);

    friends = await friendsService.getFriends(alice.id);
    expect(friends).toHaveLength(0);
  });

  it('should prevent duplicate friend additions', async () => {
    const alice = await usersService.create({ name: '앨리스', phone: '010-5555-5555' });
    const bob = await usersService.create({ name: '밥', phone: '010-6666-6666' });

    await friendsService.addFriend(alice.id, bob.id);
    await expect(friendsService.addFriend(alice.id, bob.id)).rejects.toThrow();
  });

  it('should prevent adding yourself as friend', async () => {
    const alice = await usersService.create({ name: '앨리스', phone: '010-7777-7777' });
    await expect(friendsService.addFriend(alice.id, alice.id)).rejects.toThrow();
  });
});
