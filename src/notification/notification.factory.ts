import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationStrategy } from './interfaces/notification-strategy.interface';
import { EmailNotificationStrategy } from './strategies/email.strategy';
import { SmsNotificationStrategy } from './strategies/sms.strategy';
import { PushNotificationStrategy } from './strategies/push.strategy';
import { NotificationChannel } from './enums/notification-channel.enum';

@Injectable()
export class NotificationFactory {
  constructor(
    private readonly emailStrategy: EmailNotificationStrategy,
    private readonly smsStrategy: SmsNotificationStrategy,
    private readonly pushStrategy: PushNotificationStrategy,
  ) {}

  getStrategy(channel: NotificationChannel): NotificationStrategy {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.emailStrategy;
      case NotificationChannel.SMS:
        return this.smsStrategy;
      case NotificationChannel.PUSH:
        return this.pushStrategy;
      default:
        throw new BadRequestException(`Unsupported notification channel: ${channel}`);
    }
  }
}
