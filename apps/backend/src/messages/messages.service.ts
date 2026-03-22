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
    const results = await this.messageRepo.query(
      `SELECT m.id, m.chat_room_id AS "chatRoomId", m.sender_id AS "senderId",
              m.text, m.type, m.file_uri AS "fileUri", m.file_name AS "fileName",
              m.created_at AS "createdAt"
       FROM messages m
       INNER JOIN chat_room_participants p ON p.chat_room_id = m.chat_room_id
       WHERE p.user_id = $1 AND LOWER(m.text) LIKE LOWER($2)
       ORDER BY m.created_at DESC
       LIMIT $3`,
      [userId, `%${query}%`, limit],
    );

    // Group by chatRoomId
    const grouped = new Map<string, Message[]>();
    for (const msg of results) {
      const list = grouped.get(msg.chatRoomId) ?? [];
      list.push(msg);
      grouped.set(msg.chatRoomId, list);
    }

    // Fetch room names
    const { ChatRoom } = await import('../chat-rooms/chat-room.entity');
    const output: { chatRoomId: string; chatRoomName: string; messages: Message[] }[] = [];
    for (const [chatRoomId, messages] of grouped) {
      const room = await this.messageRepo.manager.findOne(
        ChatRoom,
        { where: { id: chatRoomId } },
      );
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
