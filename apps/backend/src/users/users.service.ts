import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { normalizePhone, hashPhone, extractChosung } from '../common/phone.utils';
import { PendingFriend } from '../friends/pending-friend.entity';
import { Friend } from '../friends/friend.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PendingFriend)
    private readonly pendingFriendRepo: Repository<PendingFriend>,
    @InjectRepository(Friend)
    private readonly friendRepo: Repository<Friend>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    if (dto.phone) {
      const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
      if (existing) {
        throw new ConflictException('Phone number already registered');
      }
    }
    const user = this.userRepo.create({
      ...dto,
      nameChosung: extractChosung(dto.name),
    });
    return this.userRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { phone } });
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { clerkId } });
  }

  async findOrCreateByClerk(clerkId: string, name: string, phone: string): Promise<User> {
    let user = await this.findByClerkId(clerkId);
    if (user) {
      // Update name_chosung if missing
      if (!user.nameChosung) {
        user.nameChosung = extractChosung(user.name);
        await this.userRepo.save(user);
      }
      return user;
    }

    // Check if phone already exists (migration case)
    if (phone) {
      user = await this.findByPhone(phone);
      if (user) {
        user.clerkId = clerkId;
        user.nameChosung = extractChosung(user.name);
        return this.userRepo.save(user);
      }
    }

    const newUser = this.userRepo.create({
      clerkId,
      name,
      phone: phone || undefined,
      nameChosung: extractChosung(name),
    });
    const savedUser = await this.userRepo.save(newUser);

    // Resolve pending friends if phone is provided
    if (phone) {
      await this.resolvePendingFriends(savedUser);
    }

    return savedUser;
  }

  /**
   * Set phone number for a user (post-registration step).
   * Also resolves any pending friend requests for this phone.
   */
  async setPhone(userId: string, phone: string): Promise<{ user: User; friendsAdded: number }> {
    const normalized = normalizePhone(phone);

    // Check uniqueness
    const existing = await this.userRepo.findOne({ where: { phone: normalized } });
    if (existing && existing.id !== userId) {
      throw new ConflictException('이미 사용 중인 전화번호입니다.');
    }

    const user = await this.findOne(userId);
    user.phone = normalized;
    const savedUser = await this.userRepo.save(user);

    // Resolve pending friends
    const friendsAdded = await this.resolvePendingFriends(savedUser);

    return { user: savedUser, friendsAdded };
  }

  /**
   * When a user registers with a phone number,
   * check pending_friends for anyone waiting for this number.
   * Auto-create friend relationships.
   */
  private async resolvePendingFriends(user: User): Promise<number> {
    if (!user.phone) return 0;

    const phoneHash = hashPhone(normalizePhone(user.phone));
    const pendingList = await this.pendingFriendRepo.find({
      where: { phoneHash },
      relations: ['user'],
    });

    let added = 0;
    for (const pending of pendingList) {
      // Check if already friends
      const existing = await this.friendRepo.findOne({
        where: { user: { id: pending.user.id }, friend: { id: user.id } },
      });
      if (!existing && pending.user.id !== user.id) {
        await this.friendRepo.save({ user: pending.user, friend: user });
        added++;
      }
    }

    // Remove resolved pending entries
    if (pendingList.length > 0) {
      await this.pendingFriendRepo.delete(
        pendingList.map((p) => p.id),
      );
    }

    return added;
  }
}
