import { BadRequestException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from './email.dto';
// import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const { EMAIL_USER, EMAIL_PASS, EMAIL_SERVER } = process.env;
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new BadRequestException('Environment secret missing');
    }
    this.transporter = nodemailer.createTransport({
      service: EMAIL_SERVER,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      debug: true,
    });
  }

  async sendMail(sendEmailDto: SendEmailDto) {
    const { to, subject, text, html } = sendEmailDto;
    try {
      const mailOptions = {
        from: `"Empresos" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }
}