import { IsOptional, IsString, IsArray, IsBoolean, IsUrl, Validate, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkPermitDto {
  @ApiPropertyOptional({ description: 'Work permit verification status of the user', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isWorkPermitVerified?: boolean;

  @ApiPropertyOptional({ description: 'User ID for whom the work permit is being updated', type: String })
  @ValidateIf(o => o.isWorkPermitVerified)
  @IsString()
  userId: string;
}
