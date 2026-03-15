import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ChatRoomsService } from './chat-rooms.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';

@Controller('chat-rooms')
export class ChatRoomsController {
  constructor(private readonly chatRoomsService: ChatRoomsService) {}

  @Post()
  create(
    @Query('userId') userId: string,
    @Body() dto: CreateChatRoomDto,
  ) {
    return this.chatRoomsService.create(userId, dto);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.chatRoomsService.findAllForUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatRoomsService.findOne(id);
  }

  @Delete(':id/leave')
  leave(
    @Param('id') roomId: string,
    @Query('userId') userId: string,
  ) {
    return this.chatRoomsService.leave(roomId, userId);
  }
}
