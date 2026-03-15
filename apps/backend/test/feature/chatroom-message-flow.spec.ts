import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoomsService } from '../../src/chat-rooms/chat-rooms.service';
import { MessagesService } from '../../src/messages/messages.service';
import { ChatRoom } from '../../src/chat-rooms/chat-room.entity';
import { ChatRoomParticipant } from '../../src/chat-rooms/chat-room-participant.entity';
import { User } from '../../src/users/user.entity';
import { Message } from '../../src/messages/message.entity';

/**
 * Layer 2 Feature Test: ChatRoom creation → Message sending flow
 * Tests ChatRoomsService + MessagesService interaction.
 */

let roomsStore: any[] = [];
let participantsStore: any[] = [];
let messagesStore: any[] = [];
let usersStore: any[] = [];
let idCounter = 0;

function uid() { return `id-${++idCounter}`; }

function createMockRoomRepo(): Partial<Repository<ChatRoom>> {
  return {
    create: jest.fn((data: any) => ({ id: uid(), createdAt: new Date(), ...data })) as any,
    save: jest.fn((room: any) => { roomsStore.push(room); return Promise.resolve(room); }) as any,
    findOne: jest.fn(({ where }: any) => {
      const room = roomsStore.find((r) => r.id === where.id);
      if (room) {
        room.participants = participantsStore
          .filter((p: any) => p.chatRoom?.id === room.id)
          .map((p: any) => ({ ...p, user: usersStore.find((u) => u.id === p.user?.id) }));
      }
      return Promise.resolve(room ?? null);
    }) as any,
    delete: jest.fn((id: string) => {
      roomsStore = roomsStore.filter((r) => r.id !== id);
      return Promise.resolve({ affected: 1 });
    }) as any,
  };
}

function createMockParticipantRepo(): Partial<Repository<ChatRoomParticipant>> {
  return {
    create: jest.fn((data: any) => ({ id: uid(), joinedAt: new Date(), ...data })) as any,
    save: jest.fn((items: any) => {
      const arr = Array.isArray(items) ? items : [items];
      arr.forEach((p: any) => participantsStore.push(p));
      return Promise.resolve(arr);
    }) as any,
    find: jest.fn(({ where }: any) => {
      const userId = where?.user?.id;
      const matches = participantsStore
        .filter((p: any) => p.user?.id === userId)
        .map((p: any) => {
          const room = roomsStore.find((r) => r.id === p.chatRoom?.id);
          return {
            ...p,
            chatRoom: room ? {
              ...room,
              participants: participantsStore
                .filter((pp: any) => pp.chatRoom?.id === room.id)
                .map((pp: any) => ({ ...pp, user: usersStore.find((u) => u.id === pp.user?.id) })),
            } : null,
          };
        });
      return Promise.resolve(matches);
    }) as any,
    delete: jest.fn(({ chatRoom, user }: any) => {
      const before = participantsStore.length;
      participantsStore = participantsStore.filter(
        (p: any) => !(p.chatRoom?.id === chatRoom?.id && p.user?.id === user?.id),
      );
      return Promise.resolve({ affected: before - participantsStore.length });
    }) as any,
    count: jest.fn(({ where }: any) => {
      const count = participantsStore.filter((p: any) => p.chatRoom?.id === where?.chatRoom?.id).length;
      return Promise.resolve(count);
    }) as any,
  };
}

function createMockUserRepo(): Partial<Repository<User>> {
  return {
    find: jest.fn(({ where }: any) => {
      const ids = where?.id?.value ?? where?.id?._value ?? [];
      return Promise.resolve(usersStore.filter((u) => ids.includes(u.id)));
    }) as any,
  };
}

function createMockMessageRepo(): Partial<Repository<Message>> {
  return {
    create: jest.fn((data: any) => ({ id: uid(), createdAt: new Date(), ...data })) as any,
    save: jest.fn((msg: any) => { messagesStore.push(msg); return Promise.resolve(msg); }) as any,
    findOne: jest.fn(({ where }: any) => {
      return Promise.resolve(messagesStore.find((m) => m.id === where.id) ?? null);
    }) as any,
    createQueryBuilder: jest.fn(() => {
      let roomId: string | null = null;
      let limit = 100;
      const qb: any = {
        where: jest.fn((_, params: any) => { roomId = params.chatRoomId; return qb; }),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn((n: number) => { limit = n; return qb; }),
        getMany: jest.fn(() => {
          const msgs = messagesStore
            .filter((m) => m.chatRoomId === roomId)
            .slice(-limit)
            .reverse();
          return Promise.resolve(msgs);
        }),
      };
      return qb;
    }) as any,
  };
}

describe('Feature: ChatRoom → Message flow', () => {
  let chatRoomsService: ChatRoomsService;
  let messagesService: MessagesService;

  beforeEach(async () => {
    roomsStore = [];
    participantsStore = [];
    messagesStore = [];
    idCounter = 0;

    // Seed users
    usersStore = [
      { id: 'u1', name: '앨리스', phone: '010-1', createdAt: new Date() },
      { id: 'u2', name: '밥', phone: '010-2', createdAt: new Date() },
      { id: 'u3', name: '찰리', phone: '010-3', createdAt: new Date() },
    ];

    const mockUserRepo = createMockUserRepo();
    // Override find for In() queries
    (mockUserRepo.find as jest.Mock).mockImplementation(({ where }: any) => {
      // Handle TypeORM In() operator
      const ids = Array.isArray(where?.id) ? where.id : (where?.id?._value ?? [where?.id]);
      return Promise.resolve(usersStore.filter((u) => ids.includes(u.id)));
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatRoomsService,
        MessagesService,
        { provide: getRepositoryToken(ChatRoom), useValue: createMockRoomRepo() },
        { provide: getRepositoryToken(ChatRoomParticipant), useValue: createMockParticipantRepo() },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Message), useValue: createMockMessageRepo() },
      ],
    }).compile();

    chatRoomsService = module.get(ChatRoomsService);
    messagesService = module.get(MessagesService);
  });

  it('should create room, send messages, and retrieve them', async () => {
    // 1. Create chat room
    const room = await chatRoomsService.create('u1', {
      name: '테스트 채팅방',
      participantIds: ['u2', 'u3'],
    });
    expect(room.id).toBeDefined();
    expect(room.name).toBe('테스트 채팅방');

    // 2. Send messages
    const msg1 = await messagesService.create(room.id, 'u1', { text: '안녕하세요!' });
    const msg2 = await messagesService.create(room.id, 'u2', { text: '반갑습니다!' });
    const msg3 = await messagesService.create(room.id, 'u1', { text: '오늘 회의 있나요?' });

    expect(msg1.chatRoomId).toBe(room.id);
    expect(msg2.senderId).toBe('u2');

    // 3. Retrieve messages
    const messages = await messagesService.findByRoom(room.id);
    expect(messages).toHaveLength(3);
    expect(messages[0].text).toBe('안녕하세요!');
    expect(messages[2].text).toBe('오늘 회의 있나요?');
  });

  it('should handle room leave and auto-delete when empty', async () => {
    // Create room with 2 people
    const room = await chatRoomsService.create('u1', {
      name: '2인 채팅',
      participantIds: ['u2'],
    });

    // Send a message
    await messagesService.create(room.id, 'u1', { text: '안녕!' });

    // User 1 leaves
    await chatRoomsService.leave(room.id, 'u1');

    // User 2 leaves → room should be deleted
    await chatRoomsService.leave(room.id, 'u2');

    // Room should be gone
    expect(roomsStore.find((r) => r.id === room.id)).toBeUndefined();
  });

  it('should support multiple message types in a room', async () => {
    const room = await chatRoomsService.create('u1', {
      name: '파일 공유방',
      participantIds: ['u2'],
    });

    const textMsg = await messagesService.create(room.id, 'u1', { text: '파일 보냅니다' });
    const imgMsg = await messagesService.create(room.id, 'u1', {
      text: '📷 사진',
      type: 'image',
      fileUri: '/uploads/photo.jpg',
      fileName: 'photo.jpg',
    });
    const emojiMsg = await messagesService.create(room.id, 'u2', {
      text: '👍',
      type: 'emoji',
    });

    const messages = await messagesService.findByRoom(room.id);
    expect(messages).toHaveLength(3);
    expect(messages[0].type).toBe('text');
    expect(messages[1].type).toBe('image');
    expect(messages[1].fileUri).toBe('/uploads/photo.jpg');
    expect(messages[2].type).toBe('emoji');
  });
});
