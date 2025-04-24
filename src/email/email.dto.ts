import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  html?: string;
}