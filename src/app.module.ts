import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from 'config/db';
import { CacheModule } from './cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { OtpModule } from './otp/otp.module';
import { SeedModule } from './seed/seed.module';
import { ProfileModule } from './profile/profile.module';
import { JobModule } from './job/job.module';
import { ApplicationModule } from './application/application.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentModule } from './payment/payment.module';
import { StripeModule } from 'nestjs-stripe';
import { BusinessModule } from './business/business.module';
import { RequestContextService } from './request-context/request-context.service';
import { BaseEntitySubscriber } from './subscribers/base-entity.subscriber';
import { RatingModule } from './rating/rating.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { mongooseConfig } from 'config/db/mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadModule } from './upload/upload.module';
import { MulterModule } from '@nestjs/platform-express';
import { NotificationModule } from './notification/notification.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    StripeModule.forRoot({
      apiKey: process.env.STRIPE_SECRET_KEY,
      apiVersion: '2025-04-30.basil' as any,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
    }),
    MulterModule.register({
      dest: './image_uploads',
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => mongooseConfig,
    }),
    RedisModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_DB_HOST,
        port: Number(process.env.REDIS_DB_PORT),
        password: process.env.REDIS_DB_AUTH,
      },
    }),
    CacheModule,
    AuthModule,
    EmailModule,
    OtpModule,
    SeedModule,
    ProfileModule,
    JobModule,
    ApplicationModule,
    PaymentModule,
    StripeModule,
    BusinessModule,
    RatingModule,
    AttendanceModule,
    AnalyticsModule,
    AdminModule,
    UploadModule,
    NotificationModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RequestContextService,
    BaseEntitySubscriber,
  ],
})
export class AppModule {}
