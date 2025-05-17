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

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    private readonly otpService: OtpService,
  ) {}

  async clockIn(jobId: string, userId: string) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Jod ID');
    if (!isUUID(userId)) throw new BadRequestException('Invalid User ID');
    try {
      return await this.attendanceRepository.save({
        job: { id: jobId },
        userId,
        clockIn: new Date(),
      });
    } catch (error) {
      throw new BadRequestException('Failed to clock in');
    }
  }

  async clockOut(jobId: string, userId: string) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Jod ID');
    if (!isUUID(userId)) throw new BadRequestException('Invalid User ID');
    try {
      const record = await this.attendanceRepository.findOne({
        where: { job: { id: jobId }, userId, clockOut: null },
      });

      if (!record) throw new NotFoundException('No active clock-in found');
      record.clockOut = new Date();
      return await this.attendanceRepository.save(record);
    } catch (error) {
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
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Jod ID');
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
      return record;
    } catch (error) {
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
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Jod ID');
    if (!isUUID(userId)) throw new BadRequestException('Invalid User ID');
    try {
      const { otp } = createAttendanceDto;
      const record = await this.attendanceRepository.findOne({
        where: { job: { id: jobId }, userId, otp, clockOut: null },
      });

      if (!record || new Date() > record.otpExpiresAt)
        throw new UnauthorizedException('OTP expired or invalid');

      record.clockOut = new Date();
      return await this.attendanceRepository.save(record);
    } catch (error) {
      throw error instanceof UnauthorizedException
        ? error
        : new BadRequestException('Failed to clock out via OTP');
    }
  }

  async generateQRCode(jobId: string) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Jod ID');
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
      return { qrCode: qr };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException('Failed to generate QR code');
    }
  }

  async getAttendanceOtp(jobId: string, user: any) {
    if (!isUUID(jobId)) throw new BadRequestException('Invalid Jod ID');
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

      return { otp: token?.otp, expiresAt };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException('Failed to generate attendance OTP');
    }
  }
}
