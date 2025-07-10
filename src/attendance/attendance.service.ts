import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { Job } from 'src/job/entities/job.entity';
import * as QRCode from 'qrcode';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { OtpService } from 'src/otp/otp.service';
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
    try {
      const isClockedIn = await this.isUserClockedIn(jobId, userId);
      if (isClockedIn) {
        throw new BadRequestException('You are already clocked in');
      }

      const job = await this.jobRepository.findOneBy({ id: jobId });
      if (!job) throw new NotFoundException('Job not found');
      if (!job.isActive) throw new BadRequestException('Job is not active');
      const result = await this.attendanceRepository.save({
        job: { id: jobId },
        userId,
        clockIn: new Date(),
      });
      return result;
    } catch (error) {
      this.logger.log(
        'attendance',
        'error',
        `Failed to clock in for user ${userId} and job ${jobId}: ${error}`,
        'attendance-service',
      );
      throw error instanceof NotFoundException
        ? error
        : error instanceof BadRequestException
          ? error
          : new InternalServerErrorException('Failed to clock in');
    }
  }

  async clockOut(jobId: string, userId: string) {
    try {
      const record = await this.attendanceRepository.findOne({
        where: { job: { id: jobId }, userId, clockOut: null },
      });

      if (!record) throw new NotFoundException('No active clock-in found');
      if (record.clockOut) {
        throw new BadRequestException('You have already clocked out');
      }
      record.clockOut = new Date();
      const result = await this.attendanceRepository.save(record);
      return result;
    } catch (error) {
      this.logger.log(
        'attendance',
        'error',
        `Failed to clock out for user ${userId} and job ${jobId}: ${error}`,
        'attendance-service',
      );
      throw error instanceof NotFoundException
        ? error
        : error instanceof BadRequestException
          ? error
          : new InternalServerErrorException('Failed to clock out');
    }
  }

  async clockInViaOtp(
    jobId: string,
    createAttendanceDto: CreateAttendanceDto,
    userId: string,
  ) {
    try {
      const isClockedIn = await this.isUserClockedIn(jobId, userId);
      if (isClockedIn) {
        throw new BadRequestException('You are already clocked in');
      }

      const { otp } = createAttendanceDto;
      const record = await this.attendanceRepository.findOne({
        where: {
          job: { id: jobId },
          userId,
          clockInOtp: otp,
          clockOut: IsNull(),
        },
      });

      if (!record || new Date() > record.clockInOtpExpiresAt)
        throw new BadRequestException('OTP expired or invalid');

      const { otpIsValid } = await this.otpService.validateOtp(
        record.clockInOtpSecret,
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
      this.logger.log(
        'attendance',
        'error',
        `Failed to clock in via OTP for user ${userId} and job ${jobId}: ${error}`,
        'attendance-service',
      );
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to clock in via OTP');
    }
  }

  async clockOutViaOtp(
    jobId: string,
    createAttendanceDto: CreateAttendanceDto,
    userId: string,
  ) {
    try {
      const { otp } = createAttendanceDto;
      const record = await this.attendanceRepository.findOne({
        where: {
          job: { id: jobId },
          userId,
          clockOutOtp: otp,
          clockOut: IsNull(),
        },
      });

      if (!record) throw new BadRequestException('Invalid or already used OTP');

      if (new Date() > record.clockOutOtpExpiresAt)
        throw new BadRequestException('OTP expired');

      if (!record.clockIn)
        throw new BadRequestException('You must clock in before clocking out');

      const { otpIsValid } = await this.otpService.validateOtp(
        record.clockOutOtpSecret,
        otp,
        'CLOCK_OUT',
      );

      if (!otpIsValid) throw new BadRequestException('Invalid OTP');

      record.clockOut = new Date();
      const result = await this.attendanceRepository.save(record);
      return result;
    } catch (error) {
      console.log({ error });
      this.logger.log(
        'attendance',
        'error',
        `Failed to clock out via OTP for user ${userId} and job ${jobId}: ${error}`,
        'attendance-service',
      );
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to clock out via OTP');
    }
  }

  async generateQRCode(jobId: string) {
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
      this.logger.log(
        'attendance',
        'error',
        `Failed to generate QR code for job ${jobId}: ${error}`,
        'attendance-service',
      );
      throw error instanceof NotFoundException
        ? error
        : error instanceof BadRequestException
          ? error
          : new InternalServerErrorException('Failed to generate QR code');
    }
  }

  async getAttendanceOtp(jobId: string, user: any, type: string) {
    try {
      if (type !== 'CLOCK_IN' && type !== 'CLOCK_OUT') {
        throw new BadRequestException(
          'Invalid type. Must be CLOCK_IN or CLOCK_OUT',
        );
      }
      const job = await this.jobRepository.findOneBy({ id: jobId });
      if (!job) throw new NotFoundException('Job not found');
      if (!job.isActive) throw new BadRequestException('Job is not active');

      const isClockedIn = await this.isUserClockedIn(jobId, user.id);
      if (type === 'CLOCK_IN' && isClockedIn) {
        throw new BadRequestException('You are already clocked in');
      }
      if (type === 'CLOCK_OUT' && !isClockedIn) {
        throw new BadRequestException('You must clock in before clocking out');
      }

      const token = await this.otpService.generateOtp(
        { email: user.email },
        user,
      );
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const payload = {
        job: { id: jobId },
        userId: user.id,
      };

      if (type === 'CLOCK_IN') {
        await this.attendanceRepository.delete({
          job: { id: jobId },
          userId: user.id,
          clockIn: IsNull(),
          clockInOtpExpiresAt: LessThan(new Date()),
        });

        await this.attendanceRepository.save({
          ...payload,
          clockInOtp: token?.otp,
          clockInOtpSecret: token?.secret,
          clockInOtpExpiresAt: expiresAt,
        });
      } else {
        const existingRecord = await this.attendanceRepository.findOne({
          where: {
            job: { id: jobId },
            userId: user.id,
            clockIn: Not(IsNull()),
            clockOut: IsNull(),
          },
        });

        if (!existingRecord) {
          throw new BadRequestException(
            'No active clock-in found for clock-out',
          );
        }

        existingRecord.clockOutOtp = token?.otp;
        existingRecord.clockOutOtpSecret = token?.secret;
        existingRecord.clockOutOtpExpiresAt = expiresAt;

        await this.attendanceRepository.save(existingRecord);
      }

      return { otp: token?.otp, expiresAt };
    } catch (error) {
      this.logger.log(
        'attendance',
        'error',
        `Failed to generate OTP for user ${user.id} and job ${jobId}: ${error}`,
        'attendance-service',
      );
      throw error instanceof NotFoundException
        ? error
        : error instanceof BadRequestException
          ? error
          : error instanceof UnauthorizedException
            ? error
            : new InternalServerErrorException(
                'Failed to generate attendance OTP',
              );
    }
  }

  private async isUserClockedIn(
    jobId: string,
    userId: string,
  ): Promise<boolean> {
    const record = await this.attendanceRepository.findOne({
      where: {
        job: { id: jobId },
        userId,
        clockIn: Not(IsNull()),
        clockOut: IsNull(),
      },
    });

    return !!record;
  }
}
