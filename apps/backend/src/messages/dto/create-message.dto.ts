import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'file', 'video', 'emoji'])
  type?: 'text' | 'image' | 'file' | 'video' | 'emoji';

  @IsOptional()
  @IsString()
  fileUri?: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
