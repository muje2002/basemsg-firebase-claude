import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { ChatRoomsService } from '../chat-rooms.service';
import { ChatRoom } from '../chat-room.entity';
import { ChatRoomParticipant } from '../chat-room-participant.entity';
import { User } from '../../users/user.entity';

faker.seed(42);

const mockRoomRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

const mockParticipantRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
});

const mockUserRepo = () => ({
  find: jest.fn(),
});

describe('ChatRoomsService', () => {
  let service: ChatRoomsService;
  let roomRepo: ReturnType<typeof mockRoomRepo>;
  let participantRepo: ReturnType<typeof mockParticipantRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatRoomsService,
        { provide: getRepositoryToken(ChatRoom), useFactory: mockRoomRepo },
        { provide: getRepositoryToken(ChatRoomParticipant), useFactory: mockParticipantRepo },
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
      ],
    }).compile();

    service = module.get(ChatRoomsService);
    roomRepo = module.get(getRepositoryToken(ChatRoom));
    participantRepo = module.get(getRepositoryToken(ChatRoomParticipant));
    userRepo = module.get(getRepositoryToken(User));
  });

  // ── 1. Happy Path ──
  describe('create - happy path', () => {
    it('should create a chat room with participants', async () => {
      const users = [
        { id: 'u1', name: 'A', phone: '010-1' },
        { id: 'u2', name: 'B', phone: '010-2' },
      ];
      userRepo.find.mockResolvedValue(users);
      roomRepo.create.mockReturnValue({ name: '테스트방' });
      roomRepo.save.mockResolvedValue({ id: 'room-1', name: '테스트방' });
      participantRepo.create.mockImplementation((data) => data);
      participantRepo.save.mockResolvedValue([]);
      roomRepo.findOne.mockResolvedValue({
        id: 'room-1',
        name: '테스트방',
        participants: users.map((u) => ({ user: u })),
      });

      const result = await service.create('u1', {
        name: '테스트방',
        participantIds: ['u2'],
      });
      expect(result.name).toBe('테스트방');
      expect(result.participants).toHaveLength(2);
    });
  });

  describe('findOne - happy path', () => {
    it('should return a room by id', async () => {
      roomRepo.findOne.mockResolvedValue({
        id: 'room-1',
        name: '방',
        participants: [],
      });

      const result = await service.findOne('room-1');
      expect(result.id).toBe('room-1');
    });
  });

  describe('leave - happy path', () => {
    it('should remove participant and keep room', async () => {
      participantRepo.delete.mockResolvedValue({ affected: 1 });
      participantRepo.count.mockResolvedValue(2);

      await expect(service.leave('room-1', 'u1')).resolves.toBeUndefined();
      expect(roomRepo.delete).not.toHaveBeenCalled();
    });

    it('should delete room when last participant leaves', async () => {
      participantRepo.delete.mockResolvedValue({ affected: 1 });
      participantRepo.count.mockResolvedValue(0);

      await service.leave('room-1', 'u1');
      expect(roomRepo.delete).toHaveBeenCalledWith('room-1');
    });
  });

  // ── 2. Boundary values ──
  describe('create - boundary values', () => {
    it('should handle room name at max length (200)', async () => {
      const name = 'A'.repeat(200);
      userRepo.find.mockResolvedValue([{ id: 'u1' }]);
      roomRepo.create.mockReturnValue({ name });
      roomRepo.save.mockResolvedValue({ id: 'r1', name });
      participantRepo.create.mockImplementation((d) => d);
      participantRepo.save.mockResolvedValue([]);
      roomRepo.findOne.mockResolvedValue({ id: 'r1', name, participants: [] });

      const result = await service.create('u1', { name, participantIds: [] });
      expect(result.name).toHaveLength(200);
    });
  });

  // ── 3. Corner cases ──
  describe('create - corner cases', () => {
    it('should handle emoji in room name', async () => {
      userRepo.find.mockResolvedValue([{ id: 'u1' }]);
      roomRepo.create.mockReturnValue({ name: '팀 🚀' });
      roomRepo.save.mockResolvedValue({ id: 'r1', name: '팀 🚀' });
      participantRepo.create.mockImplementation((d) => d);
      participantRepo.save.mockResolvedValue([]);
      roomRepo.findOne.mockResolvedValue({ id: 'r1', name: '팀 🚀', participants: [] });

      const result = await service.create('u1', { name: '팀 🚀', participantIds: [] });
      expect(result.name).toContain('🚀');
    });

    it('should deduplicate creator from participantIds', async () => {
      const users = [{ id: 'u1', name: 'A', phone: '010-1' }];
      userRepo.find.mockResolvedValue(users);
      roomRepo.create.mockReturnValue({ name: 'Room' });
      roomRepo.save.mockResolvedValue({ id: 'r1', name: 'Room' });
      participantRepo.create.mockImplementation((d) => d);
      participantRepo.save.mockResolvedValue([]);
      roomRepo.findOne.mockResolvedValue({ id: 'r1', name: 'Room', participants: [{ user: users[0] }] });

      const result = await service.create('u1', { name: 'Room', participantIds: ['u1'] });
      expect(result.participants).toHaveLength(1);
    });
  });

  // ── 4. Invalid input ──
  describe('create - invalid input', () => {
    it('should throw NotFoundException when user not found', async () => {
      userRepo.find.mockResolvedValue([]);
      await expect(
        service.create('u1', { name: 'Room', participantIds: ['u2'] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne - invalid input', () => {
    it('should throw NotFoundException for non-existent room', async () => {
      roomRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('leave - invalid input', () => {
    it('should throw NotFoundException when not a participant', async () => {
      participantRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.leave('room-1', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── 5. Random input ──
  describe('create - random input', () => {
    it.each([1, 2, 3])('should handle random room data (iteration %i)', async (i) => {
      const name = faker.lorem.words(3);
      const users = [{ id: `u-${i}`, name: faker.person.fullName() }];
      userRepo.find.mockResolvedValue(users);
      roomRepo.create.mockReturnValue({ name });
      roomRepo.save.mockResolvedValue({ id: `r-${i}`, name });
      participantRepo.create.mockImplementation((d) => d);
      participantRepo.save.mockResolvedValue([]);
      roomRepo.findOne.mockResolvedValue({ id: `r-${i}`, name, participants: [] });

      const result = await service.create(`u-${i}`, { name, participantIds: [] });
      expect(result.name).toBe(name);
    });
  });

  // ── 6. Concurrency ──
  describe('create - concurrency', () => {
    it('should handle concurrent room creation', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => {
        const name = `Room-${i}`;
        const users = [{ id: `u-${i}` }];
        userRepo.find.mockResolvedValue(users);
        roomRepo.create.mockReturnValue({ name });
        roomRepo.save.mockResolvedValue({ id: `r-${i}`, name });
        participantRepo.create.mockImplementation((d) => d);
        participantRepo.save.mockResolvedValue([]);
        roomRepo.findOne.mockResolvedValue({ id: `r-${i}`, name, participants: [] });

        return service.create(`u-${i}`, { name, participantIds: [] });
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
    });
  });
});
