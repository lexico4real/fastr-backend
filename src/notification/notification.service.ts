import { Injectable } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationFactory } from './notification.factory';
import { NotificationChannel } from './enums/notification-channel.enum';
import { QueueName } from 'common/enums/job-constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationService {
  constructor(
    private readonly factory: NotificationFactory,
    @InjectQueue(QueueName.NOTIFICATION_QUEUE)
    private readonly pushQueue: Queue,
  ) {}

  async sendNotification(dto: SendNotificationDto): Promise<void> {
    if (dto.channel === NotificationChannel.PUSH) {
      const priority = dto.metadata?.priority ?? 5;

      await this.pushQueue.add(
        QueueName.PUSH_QUEUE,
        {
          recipient: dto.recipient,
          message: dto.message,
          metadata: dto.metadata,
        },
        {
          priority,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    } else {
      const strategy = this.factory.getStrategy(dto.channel);
      await strategy.send(dto.recipient, dto.message, dto.metadata);
    }
  }
}
