import {
  IsEmail,
  IsEnum,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from 'common/enums/account-status';
import { RolesConstant } from 'common/enums/roles';

export class CreateUserDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'The account status of the user',
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;

  @ApiPropertyOptional({
    description: 'The role of the user',
    enum: RolesConstant,
    example: RolesConstant.ADMIN,
  })
  @IsOptional()
  @IsEnum(RolesConstant)
  role?: RolesConstant;

  @ApiProperty({
    description: 'The password for the user account',
    example: 'P@ssw0rd123',
  })
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,32}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;
}