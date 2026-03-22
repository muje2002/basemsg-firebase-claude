import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('pending_friends')
@Unique(['user', 'phoneHash'])
export class PendingFriend {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ name: 'phone_hash', length: 64 })
  phoneHash!: string;

  @Column({ name: 'contact_name', length: 200, nullable: true })
  contactName?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
