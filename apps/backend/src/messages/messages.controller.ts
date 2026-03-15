import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('chat-rooms/:roomId/messages')
  create(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(roomId, userId, dto);
  }

  @Get('chat-rooms/:roomId/messages')
  findByRoom(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.findByRoom(
      roomId,
      limit ? parseInt(limit, 10) : 100,
      before,
    );
  }

  @Get('messages/search')
  searchMessages(
    @Query('userId') userId: string,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.searchMessages(
      userId,
      query,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
