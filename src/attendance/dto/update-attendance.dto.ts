import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-attendance.dto';
import { IsOptional } from 'class-validator';

export class UpdateAttendanceDto extends PartialType(CreateAttendanceDto) {
  @ApiPropertyOptional({
    description: 'The OTP for clocking in or out',
    example: '123456',
  })
  @IsOptional()
  otp?: string;
}
