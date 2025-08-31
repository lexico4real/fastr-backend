import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class OnboardingOtpDto {
  @ApiProperty({
    description: 'The pre-onboarding UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  preOnboardingCode: string;
}
