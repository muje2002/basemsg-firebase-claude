import { IsString, IsUUID } from 'class-validator';

export class AddFriendDto {
  @IsString()
  @IsUUID()
  friendId!: string;
}
