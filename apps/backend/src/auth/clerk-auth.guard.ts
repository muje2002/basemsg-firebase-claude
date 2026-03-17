import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

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
      (request as Request & { clerkUserId: string }).clerkUserId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
