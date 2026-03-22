import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AddFriendDto } from './dto/add-friend.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ClerkUser } from '../auth/clerk-user.decorator';

@Controller('friends')
@UseGuards(ClerkAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post()
  addFriend(
    @ClerkUser() userId: string,
    @Body() dto: AddFriendDto,
  ) {
    return this.friendsService.addFriend(userId, dto.friendId);
  }

  @Get()
  getFriends(@ClerkUser() userId: string) {
    return this.friendsService.getFriends(userId);
  }

  /** 연락처 동기화 — 매칭된 유저는 친구 추가, 미가입자는 pending 저장 */
  @Post('sync-contacts')
  syncContacts(
    @ClerkUser() userId: string,
    @Body() body: { contacts: Array<{ phone: string; name: string }> },
  ) {
    return this.friendsService.syncContacts(userId, body.contacts);
  }

  /** @deprecated Use sync-contacts instead */
  @Post('by-phones')
  addFriendsByPhones(
    @ClerkUser() userId: string,
    @Body() body: { phones: string[] },
  ) {
    return this.friendsService.addFriendsByPhones(userId, body.phones);
  }

  @Delete(':friendId')
  removeFriend(
    @ClerkUser() userId: string,
    @Param('friendId') friendId: string,
  ) {
    return this.friendsService.removeFriend(userId, friendId);
  }
}
