import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async create(
    chatRoomId: string,
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<Message> {
    const message = this.messageRepo.create({
      chatRoomId,
      senderId,
      text: dto.text,
      type: dto.type ?? 'text',
      fileUri: dto.fileUri,
      fileName: dto.fileName,
    });
    return this.messageRepo.save(message);
  }

  async findByRoom(
    chatRoomId: string,
    limit = 100,
    before?: string,
  ): Promise<Message[]> {
    const qb = this.messageRepo
      .createQueryBuilder('message')
      .where('message.chat_room_id = :chatRoomId', { chatRoomId })
      .orderBy('message.created_at', 'DESC')
      .take(limit);

    if (before) {
      qb.andWhere('message.created_at < :before', { before });
    }

    const messages = await qb.getMany();
    return messages.reverse();
  }

  async searchMessages(
    userId: string,
    query: string,
    limit = 50,
  ): Promise<{ chatRoomId: string; chatRoomName: string; messages: Message[] }[]> {
    const results = await this.messageRepo
      .createQueryBuilder('message')
      .innerJoin('message.chatRoom', 'room')
      .innerJoin('room.participants', 'participant')
      .where('participant.user_id = :userId', { userId })
      .andWhere('LOWER(message.text) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('message.created_at', 'DESC')
      .take(limit)
      .getMany();

    // Group by chatRoomId
    const grouped = new Map<string, Message[]>();
    for (const msg of results) {
      const list = grouped.get(msg.chatRoomId) ?? [];
      list.push(msg);
      grouped.set(msg.chatRoomId, list);
    }

    // Fetch room names
    const output: { chatRoomId: string; chatRoomName: string; messages: Message[] }[] = [];
    for (const [chatRoomId, messages] of grouped) {
      const room = await this.messageRepo.manager.findOne(
        'ChatRoom',
        { where: { id: chatRoomId } },
      ) as { name: string } | null;
      output.push({
        chatRoomId,
        chatRoomName: room?.name ?? '',
        messages,
      });
    }

    return output;
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: { id },
      relations: ['sender'],
    });
    if (!message) {
      throw new NotFoundException(`Message ${id} not found`);
    }
    return message;
  }
}
