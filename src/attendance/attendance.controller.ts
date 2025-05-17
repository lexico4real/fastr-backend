import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('attendance')
@UseGuards(AuthGuard())
@ApiBearerAuth('token')
@ApiTags('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clockin/:jobId/qr')
  clockInViaQR(@Param('jobId') jobId: string, @Req() req: Request) {
    return this.attendanceService.clockIn(jobId, req.user?.['id']);
  }

  @Post('clockout/:jobId/qr')
  clockOutViaQR(@Param('jobId') jobId: string, @Req() req: Request) {
    return this.attendanceService.clockOut(jobId, req.user?.['id']);
  }

  @Post('clockin/:jobId/otp')
  clockInViaOTP(
    @Param('jobId') jobId: string,
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Req() req: Request,
  ) {
    return this.attendanceService.clockInViaOtp(
      jobId,
      createAttendanceDto,
      req.user?.['id'],
    );
  }

  @Post('clockout/:jobId/otp')
  clockOutViaOTP(
    @Param('jobId') jobId: string,
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Req() req: Request,
  ) {
    return this.attendanceService.clockOutViaOtp(
      jobId,
      createAttendanceDto,
      req.user?.['id'],
    );
  }

  @Get('jobs/:jobId/qr-code')
  generateQRCode(@Param('jobId') jobId: string) {
    return this.attendanceService.generateQRCode(jobId);
  }

  @Post('jobs/:jobId/generate-otp')
  getAttendanceOtp(@Param('jobId') jobId: string, @Req() req: Request) {
    return this.attendanceService.getAttendanceOtp(jobId, req.user);
  }
}
