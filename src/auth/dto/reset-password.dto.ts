import { IsString, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class NewPasswordDto {
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
