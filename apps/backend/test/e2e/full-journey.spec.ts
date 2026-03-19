import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { UsersModule } from '../../src/users/users.module';
import { FriendsModule } from '../../src/friends/friends.module';
import { ChatRoomsModule } from '../../src/chat-rooms/chat-rooms.module';
import { MessagesModule } from '../../src/messages/messages.module';
import { AuthModule } from '../../src/auth/auth.module';
import { ClerkAuthGuard } from '../../src/auth/clerk-auth.guard';
import { User } from '../../src/users/user.entity';
import { Friend } from '../../src/friends/friend.entity';
import { ChatRoom } from '../../src/chat-rooms/chat-room.entity';
import { ChatRoomParticipant } from '../../src/chat-rooms/chat-room-participant.entity';
import { Message } from '../../src/messages/message.entity';

/**
 * Mock ClerkAuthGuard that reads userId from query param instead of JWT.
 * This allows E2E tests to run without Clerk auth infrastructure.
 */
class MockClerkAuthGuard {
  canActivate(context: any) {
    const request = context.switchToHttp().getRequest();
    const userId = request.query?.userId;
    if (userId) {
      request.userId = userId;
      request.clerkUserId = userId;
    }
    return true;
  }
}

/**
 * Layer 3 Scenario Test: Full user journey E2E
 * Uses SQLite in-memory database for isolation.
 */
describe('E2E: Full User Journey', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User, Friend, ChatRoom, ChatRoomParticipant, Message],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
        UsersModule,
        FriendsModule,
        ChatRoomsModule,
        MessagesModule,
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useClass(MockClerkAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  let aliceId: string;
  let bobId: string;
  let charlieId: string;
  let roomId: string;

  // ── Scenario 1: Register → Add Friends → Create Room → Chat ──

  it('Step 1: Register users', async () => {
    const res1 = await request(server)
      .post('/api/users')
      .send({ name: '앨리스', phone: '010-1111-1111' })
      .expect(201);
    aliceId = res1.body.id;
    expect(aliceId).toBeDefined();

    const res2 = await request(server)
      .post('/api/users')
      .send({ name: '밥', phone: '010-2222-2222' })
      .expect(201);
    bobId = res2.body.id;

    const res3 = await request(server)
      .post('/api/users')
      .send({ name: '찰리', phone: '010-3333-3333' })
      .expect(201);
    charlieId = res3.body.id;
  });

  it('Step 2: Alice adds Bob and Charlie as friends', async () => {
    await request(server)
      .post(`/api/friends?userId=${aliceId}`)
      .send({ friendId: bobId })
      .expect(201);

    await request(server)
      .post(`/api/friends?userId=${aliceId}`)
      .send({ friendId: charlieId })
      .expect(201);

    const res = await request(server)
      .get(`/api/friends?userId=${aliceId}`)
      .expect(200);

    expect(res.body).toHaveLength(2);
  });

  it('Step 3: Alice creates a group chat room', async () => {
    const res = await request(server)
      .post(`/api/chat-rooms?userId=${aliceId}`)
      .send({ name: '프로젝트 팀', participantIds: [bobId, charlieId] })
      .expect(201);

    roomId = res.body.id;
    expect(res.body.name).toBe('프로젝트 팀');
    expect(res.body.participants).toHaveLength(3);
  });

  it('Step 4: Users exchange messages', async () => {
    await request(server)
      .post(`/api/chat-rooms/${roomId}/messages?userId=${aliceId}`)
      .send({ text: '안녕하세요 팀!' })
      .expect(201);

    await request(server)
      .post(`/api/chat-rooms/${roomId}/messages?userId=${bobId}`)
      .send({ text: '반갑습니다!' })
      .expect(201);

    await request(server)
      .post(`/api/chat-rooms/${roomId}/messages?userId=${charlieId}`)
      .send({ text: '네 안녕하세요 😊', type: 'emoji' })
      .expect(201);

    const res = await request(server)
      .get(`/api/chat-rooms/${roomId}/messages`)
      .expect(200);

    expect(res.body).toHaveLength(3);
  });

  it('Step 5: Retrieve chat rooms for user', async () => {
    const res = await request(server)
      .get(`/api/chat-rooms?userId=${aliceId}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((r: any) => r.name === '프로젝트 팀')).toBe(true);
  });

  // ── Scenario 2: Friend removal ──

  it('Step 6: Alice removes Charlie as friend', async () => {
    await request(server)
      .delete(`/api/friends/${charlieId}?userId=${aliceId}`)
      .expect(200);

    const res = await request(server)
      .get(`/api/friends?userId=${aliceId}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(bobId);
  });

  // ── Scenario 3: Leave chat room ──

  it('Step 7: Charlie leaves the room', async () => {
    await request(server)
      .delete(`/api/chat-rooms/${roomId}/leave?userId=${charlieId}`)
      .expect(200);

    const room = await request(server)
      .get(`/api/chat-rooms/${roomId}`)
      .expect(200);

    expect(room.body.participants).toHaveLength(2);
  });

  it('Step 8: Bob and Alice leave → room auto-deleted', async () => {
    await request(server)
      .delete(`/api/chat-rooms/${roomId}/leave?userId=${bobId}`)
      .expect(200);

    await request(server)
      .delete(`/api/chat-rooms/${roomId}/leave?userId=${aliceId}`)
      .expect(200);

    // Room should be deleted
    await request(server)
      .get(`/api/chat-rooms/${roomId}`)
      .expect(404);
  });

  // ── Scenario 4: Validation ──

  it('Step 9: Duplicate user registration should fail', async () => {
    await request(server)
      .post('/api/users')
      .send({ name: '앨리스', phone: '010-1111-1111' })
      .expect(409);
  });

  it('Step 10: Invalid input should be rejected', async () => {
    // Missing required field
    await request(server)
      .post('/api/users')
      .send({ name: '' })
      .expect(400);

    // Invalid friend id
    await request(server)
      .post(`/api/friends?userId=${aliceId}`)
      .send({ friendId: 'not-a-uuid' })
      .expect(400);
  });
});
