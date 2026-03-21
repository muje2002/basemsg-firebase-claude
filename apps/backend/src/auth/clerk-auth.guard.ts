import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
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

      // Resolve clerkId → internal userId via direct query
      const result = await this.dataSource.query(
        `SELECT id FROM users WHERE clerk_id = $1 LIMIT 1`,
        [clerkId],
      );
      if (result.length > 0) {
        (request as Request & { userId: string }).userId = result[0].id;
      }

      return true;
    } catch (error) {
      console.error('[ClerkAuthGuard] Token verification failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
