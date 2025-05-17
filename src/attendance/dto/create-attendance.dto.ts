import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateAttendanceDto {
  @IsOptional()
  @IsString()
  otp: string;
}
