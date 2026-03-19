import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authHeader.split(' ')[1];
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY', '');

    try {
      const payload = await verifyToken(token, { secretKey });
      const clerkId = payload.sub;
      (request as Request & { clerkUserId: string }).clerkUserId = clerkId;

      // Resolve clerkId → internal userId
      const user = await this.usersService.findByClerkId(clerkId);
      if (user) {
        (request as Request & { userId: string }).userId = user.id;
      }

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
