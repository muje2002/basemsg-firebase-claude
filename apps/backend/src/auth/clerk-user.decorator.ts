import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const ClerkUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request & { clerkUserId: string }>();
    return request.clerkUserId;
  },
);
