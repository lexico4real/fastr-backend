import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Data Transfer Object (DTO) for resetting a user's password.
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'The unique identifier of the user.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'The reset token sent to the user.',
    example: 'abc123resetToken',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class NewPasswordDto {
  @ApiProperty({
    description: 'The new password for the user.',
    example: 'StrongP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,32}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}
