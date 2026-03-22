import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friend } from './friend.entity';
import { ContactUpload } from './contact-upload.entity';
import { PendingFriend } from './pending-friend.entity';
import { User } from '../users/user.entity';
import { normalizePhone, hashPhone } from '../common/phone.utils';

export interface SyncContactsResult {
  added: Array<{ id: string; name: string; phone: string }>;
  alreadyFriends: number;
  pending: number;
  total: number;
}

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepo: Repository<Friend>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ContactUpload)
    private readonly contactUploadRepo: Repository<ContactUpload>,
    @InjectRepository(PendingFriend)
    private readonly pendingFriendRepo: Repository<PendingFriend>,
  ) {}

  async addFriend(userId: string, friendId: string): Promise<Friend> {
    if (userId === friendId) {
      throw new BadRequestException('Cannot add yourself as a friend');
    }

    const [user, friendUser] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.userRepo.findOne({ where: { id: friendId } }),
    ]);

    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (!friendUser) throw new NotFoundException(`User ${friendId} not found`);

    const existing = await this.friendRepo.findOne({
      where: { user: { id: userId }, friend: { id: friendId } },
    });
    if (existing) {
      throw new ConflictException('Already friends');
    }

    const friend = this.friendRepo.create({ user, friend: friendUser });
    return this.friendRepo.save(friend);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const result = await this.friendRepo.delete({
      user: { id: userId },
      friend: { id: friendId },
    });
    if (result.affected === 0) {
      throw new NotFoundException('Friend relationship not found');
    }
  }

  /**
   * Sync contacts from device.
   * - Matches against registered users → create friend records
   * - Unmatched → store as pending (auto-add when they register)
   */
  async syncContacts(
    userId: string,
    contacts: Array<{ phone: string; name: string }>,
  ): Promise<SyncContactsResult> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const added: Array<{ id: string; name: string; phone: string }> = [];
    let alreadyFriends = 0;
    let pending = 0;

    for (const contact of contacts) {
      const normalized = normalizePhone(contact.phone);
      if (!normalized) continue;

      const phoneHash = hashPhone(normalized);

      // Store in contact_uploads (upsert)
      try {
        await this.contactUploadRepo
          .createQueryBuilder()
          .insert()
          .values({ user, phoneHash, contactName: contact.name })
          .orIgnore()
          .execute();
      } catch {
        // Ignore duplicate
      }

      // Find registered user with this phone
      const matchedUser = await this.userRepo.findOne({ where: { phone: normalized } });

      if (!matchedUser || matchedUser.id === userId) {
        // Not found or self → store as pending
        if (matchedUser?.id !== userId) {
          try {
            await this.pendingFriendRepo
              .createQueryBuilder()
              .insert()
              .values({ user, phoneHash, contactName: contact.name })
              .orIgnore()
              .execute();
            pending++;
          } catch {
            // Ignore duplicate
          }
        }
        continue;
      }

      // Check if already friends
      const existing = await this.friendRepo.findOne({
        where: { user: { id: userId }, friend: { id: matchedUser.id } },
      });
      if (existing) {
        alreadyFriends++;
        continue;
      }

      // Create friend relationship
      await this.friendRepo.save({ user, friend: matchedUser });
      added.push({
        id: matchedUser.id,
        name: matchedUser.name,
        phone: matchedUser.phone ?? '',
      });
    }

    return { added, alreadyFriends, pending, total: contacts.length };
  }

  /** @deprecated Use syncContacts instead */
  async addFriendsByPhones(
    userId: string,
    phones: string[],
  ): Promise<{ added: User[]; notFound: string[] }> {
    const contacts = phones.map((phone) => ({ phone, name: '' }));
    const result = await this.syncContacts(userId, contacts);
    return {
      added: result.added.map((a) => ({ id: a.id, name: a.name, phone: a.phone }) as User),
      notFound: [],
    };
  }

  async getFriends(userId: string): Promise<User[]> {
    const friends = await this.friendRepo.find({
      where: { user: { id: userId } },
      relations: ['friend'],
      order: { addedAt: 'DESC' },
    });
    return friends.map((f) => f.friend);
  }
}
