import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OtpDto {
  @IsOptional()
  @IsString()
  secret?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}