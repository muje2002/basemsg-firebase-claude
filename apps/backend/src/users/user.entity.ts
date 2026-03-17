import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Friend } from '../friends/friend.entity';
import { ChatRoomParticipant } from '../chat-rooms/chat-room-participant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clerk_id', unique: true, nullable: true })
  clerkId?: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 20, unique: true })
  phone!: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Friend, (friend) => friend.user)
  friends!: Friend[];

  @OneToMany(() => ChatRoomParticipant, (p) => p.user)
  chatRoomParticipants!: ChatRoomParticipant[];
}
