import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ClerkUser } from '../auth/clerk-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /** Clerk 로그인 후 호출 — DB에 사용자 동기화 */
  @Post('sync')
  @UseGuards(ClerkAuthGuard)
  syncUser(
    @ClerkUser() clerkId: string,
    @Body() body: { name: string; phone: string },
  ) {
    return this.usersService.findOrCreateByClerk(clerkId, body.name, body.phone);
  }
}
