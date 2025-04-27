import { IsString, IsOptional, IsEmail, IsBase64 } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsBase64()
  photo?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
