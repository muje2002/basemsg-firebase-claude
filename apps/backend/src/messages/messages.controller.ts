import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat-rooms/:roomId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(
    @Param('roomId') roomId: string,
    @Query('userId') userId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(roomId, userId, dto);
  }

  @Get()
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
}
