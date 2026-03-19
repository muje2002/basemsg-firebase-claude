import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extract the internal userId (UUID) resolved by ClerkAuthGuard.
 * Falls back to clerkUserId if internal user not yet synced.
 */
export const ClerkUser = createParamDecorator(
  (data: 'clerkId' | undefined, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request & { userId?: string; clerkUserId: string }>();
    if (data === 'clerkId') {
      return request.clerkUserId;
    }
    return request.userId ?? request.clerkUserId;
  },
);
