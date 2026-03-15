import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { ChatRoomsModule } from './chat-rooms/chat-rooms.module';
import { MessagesModule } from './messages/messages.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get('POSTGRES_USER', 'basemsg'),
        password: config.get('POSTGRES_PASSWORD', 'basemsg123'),
        database: config.get('POSTGRES_DB', 'basemsg'),
        autoLoadEntities: true,
        synchronize: true, // dev only — use migrations in production
      }),
    }),
    UsersModule,
    FriendsModule,
    ChatRoomsModule,
    MessagesModule,
    GatewayModule,
  ],
})
export class AppModule {}
