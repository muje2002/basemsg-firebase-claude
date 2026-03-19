import { Module, forwardRef, Global } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [ClerkAuthGuard],
  exports: [ClerkAuthGuard],
})
export class AuthModule {}
