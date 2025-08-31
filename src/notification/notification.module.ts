import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationFactory } from './notification.factory';
import { EmailNotificationStrategy } from './strategies/email.strategy';
import { PushNotificationStrategy } from './strategies/push.strategy';
import { SmsNotificationStrategy } from './strategies/sms.strategy';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { QueueName } from 'common/enums/job-constants';
import { PassportModule } from '@nestjs/passport';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forRoot(),
    BullModule.registerQueue({
      name: QueueName.NOTIFICATION_QUEUE,
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationFactory,
    EmailNotificationStrategy,
    SmsNotificationStrategy,
    PushNotificationStrategy,
  ],
  exports: [
    NotificationService,
    NotificationFactory,
    EmailNotificationStrategy,
    SmsNotificationStrategy,
    PushNotificationStrategy,
  ],
})
export class NotificationModule {}
