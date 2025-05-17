import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from 'src/job/entities/job.entity';
import { Attendance } from './entities/attendance.entity';
import { EmailModule } from 'src/email/email.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Job]),
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
