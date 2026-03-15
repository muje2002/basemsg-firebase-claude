import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { ChatRoomParticipant } from './chat-room-participant.entity';
import { User } from '../users/user.entity';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';

@Injectable()
export class ChatRoomsService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatRoomParticipant)
    private readonly participantRepo: Repository<ChatRoomParticipant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(creatorId: string, dto: CreateChatRoomDto): Promise<ChatRoom> {
    const allIds = [...new Set([creatorId, ...dto.participantIds])];
    const users = await this.userRepo.find({ where: { id: In(allIds) } });

    if (users.length !== allIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    const room = this.roomRepo.create({ name: dto.name });
    const savedRoom = await this.roomRepo.save(room);

    const participants = users.map((user) =>
      this.participantRepo.create({ chatRoom: savedRoom, user }),
    );
    await this.participantRepo.save(participants);

    return this.findOne(savedRoom.id);
  }

  async findAllForUser(userId: string): Promise<ChatRoom[]> {
    const participations = await this.participantRepo.find({
      where: { user: { id: userId } },
      relations: ['chatRoom', 'chatRoom.participants', 'chatRoom.participants.user'],
    });
    return participations.map((p) => p.chatRoom);
  }

  async findOne(id: string): Promise<ChatRoom> {
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: ['participants', 'participants.user'],
    });
    if (!room) {
      throw new NotFoundException(`ChatRoom ${id} not found`);
    }
    return room;
  }

  async leave(roomId: string, userId: string): Promise<void> {
    const result = await this.participantRepo.delete({
      chatRoom: { id: roomId },
      user: { id: userId },
    });
    if (result.affected === 0) {
      throw new NotFoundException('Not a participant of this room');
    }

    // Delete room if no participants left
    const remaining = await this.participantRepo.count({
      where: { chatRoom: { id: roomId } },
    });
    if (remaining === 0) {
      await this.roomRepo.delete(roomId);
    }
  }
}
