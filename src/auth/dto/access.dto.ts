import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AccessDto {
  @ApiProperty({
    description: 'The name of the access entity',
    example: 'Admin Access',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'An optional comment about the access entity',
    example: 'This is for administrative purposes',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}