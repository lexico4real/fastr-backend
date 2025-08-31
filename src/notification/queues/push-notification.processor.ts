import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { PushNotificationStrategy } from '../strategies/push.strategy';
import { Logger } from '@nestjs/common';
import { QueueName } from 'common/enums/job-constants';
import { AuditService } from 'src/audit/audit.service';

@Processor(QueueName.NOTIFICATION_QUEUE)
export class PushNotificationProcessor {
  private readonly logger = new Logger(PushNotificationProcessor.name);

  constructor(
    private readonly pushStrategy: PushNotificationStrategy,
    private readonly auditService: AuditService,
  ) {}

  @Process(QueueName.PUSH_QUEUE)
  async handleSendPush(job: Job) {
    const { recipient, message, metadata } = job.data;

    try {
      await this.pushStrategy.send(recipient, message, metadata);
      this.logger.log(`Push notification sent to ${recipient}`);
    } catch (error) {
      this.logger.error(`Push notification failed: ${error.message}`);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.verbose(
      `Processing job ${job.id} of type ${job.name} to ${job.data.recipient}`,
    );
  }

  @OnQueueCompleted()
  async onCompleted(job: Job) {
    this.logger.log(
      `✅ Job ${job.id} (push to ${job.data.recipient}) completed successfully`,
    );
    await this.auditService.log(
      'PushNotificationSent',
      job.data.recipient,
      job.data.message,
      { metadata: job.data.metadata },
    );
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `❌ Job ${job.id} (push to ${job.data.recipient}) failed: ${error.message}`,
    );
    await this.auditService.log(
      'PushNotificationFailed',
      job.data.recipient,
      error.message,
      { stack: error.stack },
    );
  }
}
