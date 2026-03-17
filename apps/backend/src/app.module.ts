import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { ChatRoomsModule } from './chat-rooms/chat-rooms.module';
import { MessagesModule } from './messages/messages.module';
import { GatewayModule } from './gateway/gateway.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const dbType = config.get<string>('DB_TYPE', 'better-sqlite3');

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: config.get<string>('POSTGRES_HOST', 'localhost'),
            port: config.get<number>('POSTGRES_PORT', 5432),
            username: config.get<string>('POSTGRES_USER', 'basemsg'),
            password: config.get<string>('POSTGRES_PASSWORD', 'basemsg123'),
            database: config.get<string>('POSTGRES_DB', 'basemsg'),
            ssl: config.get<string>('POSTGRES_SSL', 'false') === 'true'
              ? { rejectUnauthorized: false }
              : false,
            autoLoadEntities: true,
            synchronize: true,
          };
        }

        return {
          type: 'better-sqlite3',
          database: config.get<string>('SQLITE_PATH', './basemsg.sqlite'),
          autoLoadEntities: true,
          synchronize: true,
        } as TypeOrmModuleOptions;
      },
    }),
    AuthModule,
    UsersModule,
    FriendsModule,
    ChatRoomsModule,
    MessagesModule,
    GatewayModule,
  ],
})
export class AppModule {}
