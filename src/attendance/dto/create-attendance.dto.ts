import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @ApiProperty({
    description: 'The OTP for clocking in or out',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;
}
