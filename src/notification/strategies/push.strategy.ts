import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { NotificationStrategy } from '../interfaces/notification-strategy.interface';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class PushNotificationStrategy
  implements NotificationStrategy, OnModuleInit
{
  private readonly logger = new Logger(PushNotificationStrategy.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const firebaseConfigPath = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );

    if (!firebaseConfigPath) {
      throw new InternalServerErrorException(
        'FIREBASE_SERVICE_ACCOUNT_PATH is missing',
      );
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          require(path.resolve(firebaseConfigPath)),
        ),
      });
      this.logger.log('Firebase Admin initialized for push notifications');
    }
  }

  async send(
    recipient: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const payload: admin.messaging.Message = {
      token: recipient,
      notification: {
        title: metadata?.title || 'Notification',
        body: message,
      },
      data: metadata?.data || {},
    };

    try {
      const response = await admin.messaging().send(payload);
      this.logger.log(`Push notification sent: ${response}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification`, error.stack);
      throw new InternalServerErrorException(
        'Failed to send push notification',
      );
    }
  }
}
