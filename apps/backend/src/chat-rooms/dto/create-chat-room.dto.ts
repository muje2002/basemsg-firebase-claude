import { IsString, IsArray, IsUUID, MaxLength, MinLength, ArrayMinSize } from 'class-validator';

export class CreateChatRoomDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  participantIds!: string[];
}
