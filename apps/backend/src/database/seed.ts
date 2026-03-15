import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Friend } from '../friends/friend.entity';
import { ChatRoom } from '../chat-rooms/chat-room.entity';
import { ChatRoomParticipant } from '../chat-rooms/chat-room-participant.entity';
import { Message } from '../messages/message.entity';
import 'reflect-metadata';

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER ?? 'basemsg',
    password: process.env.POSTGRES_PASSWORD ?? 'basemsg123',
    database: process.env.POSTGRES_DB ?? 'basemsg',
    entities: [User, Friend, ChatRoom, ChatRoomParticipant, Message],
    synchronize: true,
  });

  await ds.initialize();
  console.log('[Seed] Database connected');

  const userRepo = ds.getRepository(User);
  const friendRepo = ds.getRepository(Friend);
  const roomRepo = ds.getRepository(ChatRoom);
  const participantRepo = ds.getRepository(ChatRoomParticipant);
  const messageRepo = ds.getRepository(Message);

  // Check if data already exists
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('[Seed] Data already exists, skipping');
    await ds.destroy();
    return;
  }

  // 1. Create users
  const users = await userRepo.save([
    { name: '나 (테스트)', phone: '010-0000-0000' },
    { name: '김민수', phone: '010-1234-5678' },
    { name: '박서연', phone: '010-2345-6789' },
    { name: '엄마', phone: '010-3456-7890' },
    { name: '아빠', phone: '010-4567-8901' },
    { name: '이지은', phone: '010-5678-9012' },
  ]);
  console.log(`[Seed] Created ${users.length} users`);

  const [me, minsu, seoyeon, mom, dad, jieun] = users;

  // 2. Create friend relationships (bidirectional)
  const friendPairs = [
    [me, minsu],
    [me, seoyeon],
    [me, mom],
    [me, dad],
    [me, jieun],
    [minsu, seoyeon],
  ];

  for (const [a, b] of friendPairs) {
    await friendRepo.save([
      { user: a, friend: b },
      { user: b, friend: a },
    ]);
  }
  console.log(`[Seed] Created ${friendPairs.length} friend pairs`);

  // 3. Create chat rooms
  const projectRoom = await roomRepo.save({ name: '프로젝트 팀' });
  const dmMinsu = await roomRepo.save({ name: '김민수' });
  const familyRoom = await roomRepo.save({ name: '가족방' });
  const dmJieun = await roomRepo.save({ name: '이지은' });
  console.log('[Seed] Created 4 chat rooms');

  // 4. Add participants
  await participantRepo.save([
    // 프로젝트 팀
    { chatRoom: projectRoom, user: me },
    { chatRoom: projectRoom, user: minsu },
    { chatRoom: projectRoom, user: seoyeon },
    // DM 김민수
    { chatRoom: dmMinsu, user: me },
    { chatRoom: dmMinsu, user: minsu },
    // 가족방
    { chatRoom: familyRoom, user: me },
    { chatRoom: familyRoom, user: mom },
    { chatRoom: familyRoom, user: dad },
    // DM 이지은
    { chatRoom: dmJieun, user: me },
    { chatRoom: dmJieun, user: jieun },
  ]);
  console.log('[Seed] Added participants');

  // 5. Create messages
  const now = Date.now();
  await messageRepo.save([
    // 프로젝트 팀
    { chatRoom: projectRoom, chatRoomId: projectRoom.id, senderId: minsu.id, sender: minsu, text: '다들 내일 회의 시간 괜찮으세요?', type: 'text' as const, createdAt: new Date(now - 10 * 60000) },
    { chatRoom: projectRoom, chatRoomId: projectRoom.id, senderId: seoyeon.id, sender: seoyeon, text: '저는 2시 이후로 가능합니다', type: 'text' as const, createdAt: new Date(now - 8 * 60000) },
    { chatRoom: projectRoom, chatRoomId: projectRoom.id, senderId: me.id, sender: me, text: '저도 2시 괜찮아요', type: 'text' as const, createdAt: new Date(now - 6 * 60000) },
    { chatRoom: projectRoom, chatRoomId: projectRoom.id, senderId: minsu.id, sender: minsu, text: '내일 회의 시간 확인해주세요!', type: 'text' as const, createdAt: new Date(now - 5 * 60000) },
    // DM 김민수
    { chatRoom: dmMinsu, chatRoomId: dmMinsu.id, senderId: me.id, sender: me, text: '안녕!', type: 'text' as const, createdAt: new Date(now - 60 * 60000) },
    { chatRoom: dmMinsu, chatRoomId: dmMinsu.id, senderId: minsu.id, sender: minsu, text: '오늘 점심 같이 먹을래?', type: 'text' as const, createdAt: new Date(now - 30 * 60000) },
    // 가족방
    { chatRoom: familyRoom, chatRoomId: familyRoom.id, senderId: mom.id, sender: mom, text: '주말에 모이자~', type: 'text' as const, createdAt: new Date(now - 2 * 3600000) },
    // DM 이지은
    { chatRoom: dmJieun, chatRoomId: dmJieun.id, senderId: jieun.id, sender: jieun, text: '어제 보내준 자료 확인했어요', type: 'text' as const, createdAt: new Date(now - 2 * 86400000) },
    { chatRoom: dmJieun, chatRoomId: dmJieun.id, senderId: me.id, sender: me, text: '네 확인 감사합니다', type: 'text' as const, createdAt: new Date(now - 86400000 - 3600000) },
    { chatRoom: dmJieun, chatRoomId: dmJieun.id, senderId: jieun.id, sender: jieun, text: '감사합니다 :)', type: 'text' as const, createdAt: new Date(now - 86400000) },
  ]);
  console.log('[Seed] Created messages');

  console.log('[Seed] Done!');
  await ds.destroy();
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
