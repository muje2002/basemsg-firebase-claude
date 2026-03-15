import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AddFriendDto } from './dto/add-friend.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post()
  addFriend(
    @Query('userId') userId: string,
    @Body() dto: AddFriendDto,
  ) {
    return this.friendsService.addFriend(userId, dto.friendId);
  }

  @Get()
  getFriends(@Query('userId') userId: string) {
    return this.friendsService.getFriends(userId);
  }

  @Post('by-phones')
  addFriendsByPhones(
    @Query('userId') userId: string,
    @Body() body: { phones: string[] },
  ) {
    return this.friendsService.addFriendsByPhones(userId, body.phones);
  }

  @Delete(':friendId')
  removeFriend(
    @Query('userId') userId: string,
    @Param('friendId') friendId: string,
  ) {
    return this.friendsService.removeFriend(userId, friendId);
  }
}
