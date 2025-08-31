import { Injectable } from '@nestjs/common';
import { NotificationStrategy } from '../interfaces/notification-strategy.interface';

@Injectable()
export class SmsNotificationStrategy implements NotificationStrategy {
  async send(recipient: string, message: string, metadata?: Record<string, any>): Promise<void> {
    // Logic to send SMS
    console.log(`Sending SMS to ${recipient}: ${message}`);
    // integrate with Twilio, Nexmo, etc.
  }
}
