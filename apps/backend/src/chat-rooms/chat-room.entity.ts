import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChatRoomParticipant } from './chat-room-participant.entity';
import { Message } from '../messages/message.entity';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => ChatRoomParticipant, (p) => p.chatRoom, { cascade: true })
  participants!: ChatRoomParticipant[];

  @OneToMany(() => Message, (m) => m.chatRoom)
  messages!: Message[];
}
