import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { Job } from 'src/job/entities/job.entity';
import * as QRCode from 'qrcode';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { OtpService } from 'src/otp/otp.service';
import { isUUID } from 'class-validator';
import Logger from 'config/logger';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    private readonly otpService: OtpService,
  ) {}

  async clockIn(jobId: string, userId: string) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Job ID');
    if (!isUUID(userId)) throw new BadRequestException('Invalid User ID');
    try {
      const result = await this.attendanceRepository.save({
        job: { id: jobId },
        userId,
        clockIn: new Date(),
      });
      this.logger.log(
        'attendance',
        'info',
        `User ${userId} clocked in for job ${jobId}`,
        'attendance-service',
      );
      return result;
    } catch (error) {
      this.logger.log(
        'attendance',
        'error',
        `Failed to clock in for user ${userId} and job ${jobId}: ${error.message}`,
        'attendance-service',
      );
      throw new BadRequestException('Failed to clock in');
    }
  }

  async clockOut(jobId: string, userId: string) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Job ID');
    if (!isUUID(userId)) throw new BadRequestException('Invalid User ID');
    try {
      const record = await this.attendanceRepository.findOne({
        where: { job: { id: jobId }, userId, clockOut: null },
      });

      if (!record) throw new NotFoundException('No active clock-in found');
      record.clockOut = new Date();
      const result = await this.attendanceRepository.save(record);
      this.logger.log(
        'attendance',
        'info',
        `User ${userId} clocked out for job ${jobId}`,
        'attendance-service',
      );
      return result;
    } catch (error) {
      this.logger.log(
        'attendance',
        'error',
        `Failed to clock out for user ${userId} and job ${jobId}: ${error.message}`,
        'attendance-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException('Failed to clock out');
    }
  }

  async clockInViaOtp(
    jobId: string,
    createAttendanceDto: CreateAttendanceDto,
    userId: string,
  ) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Job ID');
    if (!isUUID(userId)) throw new BadRequestException('Invalid User ID');
    try {
      const { otp } = createAttendanceDto;
      const record = await this.attendanceRepository.findOne({
        where: { job: { id: jobId }, userId, otp, clockOut: null },
      });

      if (!record || new Date() > record.otpExpiresAt)
        throw new UnauthorizedException('OTP expired or invalid');

      const { otpIsValid } = await this.otpService.validateOtp(
        record.otpSecret,
        otp,
        'CLOCK-IN',
      );
      if (!otpIsValid) {
        throw new BadRequestException('OTP expired or invalid');
      }

      record.clockIn = new Date();
      await this.attendanceRepository.save(record);
      this.logger.log(
        'attendance',
        'info',
        `User ${userId} clocked in via OTP for job ${jobId}`,
        'attendance-service',
      );
      return record;
    } catch (error) {
      this.logger.log(
        'attendance',
        'error',
        `Failed to clock in via OTP for user ${userId} and job ${jobId}: ${error.message}`,
        'attendance-service',
      );
      throw error instanceof UnauthorizedException
        ? error
        : new BadRequestException('Failed to clock in via OTP');
    }
  }

  async clockOutViaOtp(
    jobId: string,
    createAttendanceDto: CreateAttendanceDto,
    userId: string,
  ) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Job ID');
    if (!isUUID(userId)) throw new BadRequestException('Invalid User ID');
    try {
      const { otp } = createAttendanceDto;
      const record = await this.attendanceRepository.findOne({
        where: { job: { id: jobId }, userId, otp, clockOut: null },
      });

      if (!record || new Date() > record.otpExpiresAt)
        throw new UnauthorizedException('OTP expired or invalid');

      record.clockOut = new Date();
      const result = await this.attendanceRepository.save(record);
      this.logger.log(
        'attendance',
        'info',
        `User ${userId} clocked out via OTP for job ${jobId}`,
        'attendance-service',
      );
      return result;
    } catch (error) {
      this.logger.log(
        'attendance',
        'error',
        `Failed to clock out via OTP for user ${userId} and job ${jobId}: ${error.message}`,
        'attendance-service',
      );
      throw error instanceof UnauthorizedException
        ? error
        : new BadRequestException('Failed to clock out via OTP');
    }
  }

  async generateQRCode(jobId: string) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Job ID');
    try {
      const job = await this.jobRepository.findOneBy({ id: jobId });
      if (!job) throw new NotFoundException('Job not found');
      if (!job.isActive) throw new BadRequestException('Job is not active');
      const qrData = JSON.stringify({
        action: 'CLOCK_IN',
        jobId,
        issuedAt: new Date().toISOString(),
      });
      const qr = await QRCode.toDataURL(qrData);
      this.logger.log(
        'attendance',
        'info',
        `Generated QR code for job ${jobId}`,
        'attendance-service',
      );
      return { qrCode: qr };
    } catch (error) {
      this.logger.log(
        'attendance',
        'error',
        `Failed to generate QR code for job ${jobId}: ${error.message}`,
        'attendance-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException('Failed to generate QR code');
    }
  }

  async getAttendanceOtp(jobId: string, user: any) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Job ID');
    try {
      const job = await this.jobRepository.findOneBy({ id: jobId });
      if (!job) throw new NotFoundException('Job not found');
      if (!job.isActive) throw new BadRequestException('Job is not active');

      const token = await this.otpService.generateOtp(
        { email: user.email },
        user,
      );
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await this.attendanceRepository.delete({
        job: { id: jobId },
        userId: user.id,
        clockOut: null,
      });

      await this.attendanceRepository.save({
        job: { id: jobId },
        userId: user.id,
        otp: token?.otp,
        otpSecret: token?.secret,
        otpExpiresAt: expiresAt,
      });

      this.logger.log(
        'attendance',
        'info',
        `Generated OTP for user ${user.id} and job ${jobId}`,
        'attendance-service',
      );
      return { otp: token?.otp, expiresAt };
    } catch (error) {
      this.logger.log(
        'attendance',
        'error',
        `Failed to generate OTP for user ${user.id} and job ${jobId}: ${error.message}`,
        'attendance-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException('Failed to generate attendance OTP');
    }
  }
}
