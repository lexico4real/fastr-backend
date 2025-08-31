import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { NotificationStrategy } from '../interfaces/notification-strategy.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailNotificationStrategy
  implements NotificationStrategy, OnModuleInit
{
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailNotificationStrategy.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const service = this.configService.get<string>('EMAIL_SERVER');

    console.log({ user, pass, service });

    if (!user || !pass) {
      throw new BadRequestException('Email environment config missing');
    }

    this.transporter = nodemailer.createTransport({
      service,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass },
      debug: true,
    });
  }

  async send(
    recipient: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const from = `"Fastr" <${this.configService.get<string>('EMAIL_USER')}>`;

    const mailOptions = {
      from,
      to: recipient,
      subject: metadata?.subject || 'Notification',
      text: message,
      html: metadata?.html || `<p>${message}</p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${recipient}`);
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw new BadRequestException(
        `Failed to send email: ${error?.message || 'Unknown error'}`,
      );
    }
  }
}
