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
