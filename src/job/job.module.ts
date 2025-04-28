import { CacheModule } from './../cache/cache.module';
import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobRepository } from './repositories/job.repository';
import { PassportModule } from '@nestjs/passport';
import { OtpModule } from 'src/otp/otp.module';
import { EmailModule } from 'src/email/email.module';
import { Application } from 'src/application/entities/application.entity';

@Module({
  imports: [
    CacheModule,
    OtpModule,
    EmailModule,
    TypeOrmModule.forFeature([Job, Application]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [JobController],
  providers: [JobService, JobRepository],
  exports: [JobService, TypeOrmModule],
})
export class JobModule {}
