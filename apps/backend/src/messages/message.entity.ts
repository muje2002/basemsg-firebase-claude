import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ChatRoom } from '../chat-rooms/chat-room.entity';
import { User } from '../users/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_room_id' })
  chatRoom!: ChatRoom;

  @Column({ name: 'chat_room_id' })
  chatRoomId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ name: 'sender_id' })
  senderId!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'varchar', length: 10, default: 'text' })
  type!: 'text' | 'image' | 'file' | 'video' | 'emoji';

  @Column({ name: 'file_uri', nullable: true })
  fileUri?: string;

  @Column({ name: 'file_name', nullable: true })
  fileName?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
