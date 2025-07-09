import { IsOptional, IsString, IsArray, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'First name of the user', type: String })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name of the user', type: String })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Other name of the user', type: String })
  @IsOptional()
  @IsString()
  otherName?: string;

  @ApiPropertyOptional({ description: 'Phone number of the user', type: String })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Bio of the user', type: String })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Resume URL of the user', type: String })
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @ApiPropertyOptional({ description: 'Skills of the user', type: [String] })
  @IsOptional()
  @IsArray()
  skills?: string[];

  @ApiPropertyOptional({ description: 'Education details of the user', type: String })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: 'Availability status of the user', type: String })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional({ description: 'Profile photo URL of the user', type: String })
  @IsOptional()
  @IsUrl()
  profilePhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Indicates if the profile is public', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
