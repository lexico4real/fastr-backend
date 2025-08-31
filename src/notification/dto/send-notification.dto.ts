import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { Type } from 'class-transformer';

export class NotificationMetadataDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  data?: Record<string, any>;
}

export class SendNotificationDto {
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationMetadataDto)
  metadata?: NotificationMetadataDto;
}
