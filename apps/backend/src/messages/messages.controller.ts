import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ClerkUser } from '../auth/clerk-user.decorator';

@Controller()
@UseGuards(ClerkAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('chat-rooms/:roomId/messages')
  create(
    @Param('roomId') roomId: string,
    @ClerkUser() userId: string,
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
    @ClerkUser() userId: string,
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
