import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChatRoomsService } from './chat-rooms.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ClerkUser } from '../auth/clerk-user.decorator';

@Controller('chat-rooms')
@UseGuards(ClerkAuthGuard)
export class ChatRoomsController {
  constructor(private readonly chatRoomsService: ChatRoomsService) {}

  @Post()
  create(
    @ClerkUser() userId: string,
    @Body() dto: CreateChatRoomDto,
  ) {
    return this.chatRoomsService.create(userId, dto);
  }

  @Get()
  findAll(@ClerkUser() userId: string) {
    return this.chatRoomsService.findAllForUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatRoomsService.findOne(id);
  }

  @Delete(':id/leave')
  leave(
    @Param('id') roomId: string,
    @ClerkUser() userId: string,
  ) {
    return this.chatRoomsService.leave(roomId, userId);
  }
}
