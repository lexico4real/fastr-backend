import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBase64 } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBase64()
  photo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
