import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReferralSourceDto {
  @ApiProperty({
    description: 'Name of the referral source',
    example: 'Facebook Ads',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of the referral source',
    example: 'Campaign in June 2025',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
