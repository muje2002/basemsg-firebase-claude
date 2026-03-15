import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friend } from './friend.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepo: Repository<Friend>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

  async addFriendsByPhones(
    userId: string,
    phones: string[],
  ): Promise<{ added: User[]; notFound: string[] }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const added: User[] = [];
    const notFound: string[] = [];

    for (const phone of phones) {
      const friendUser = await this.userRepo.findOne({ where: { phone } });
      if (!friendUser) {
        notFound.push(phone);
        continue;
      }
      if (friendUser.id === userId) continue;

      const existing = await this.friendRepo.findOne({
        where: { user: { id: userId }, friend: { id: friendUser.id } },
      });
      if (existing) continue;

      await this.friendRepo.save({ user, friend: friendUser });
      added.push(friendUser);
    }

    return { added, notFound };
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
