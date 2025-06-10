import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateBusinessDto } from './create-business.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @ApiPropertyOptional({ description: 'Name of the business' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ description: 'Registration number of the business' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    description: 'Address of the business',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Verification status of the business',
    required: false,
  })
  @IsOptional()
  @IsString()
  verificationStatus?: string;
}
