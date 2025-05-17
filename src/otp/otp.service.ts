import { Injectable } from '@nestjs/common';
import { CacheService } from './../cache/cache.service';
import { OtpDto } from './otp.dto';
import { generateRandomValue } from 'common/utils/generate-numbers';
import Logger from 'config/logger';

@Injectable()
export class OtpService {
  private readonly logger = new Logger();
  private NODE_ENV = process.env.NODE_ENV;

  constructor(private readonly cacheService: CacheService) {}

  async generateOtp(otpDto: OtpDto, user: any) {
    const { email } = otpDto;

    const secret = generateRandomValue('alphanumeric', 32);

    let otp: any;
    if (
      email?.includes('lexico4real@gmail.com') &&
      this.NODE_ENV !== 'production'
    ) {
      otp = '000000';
    } else {
      otp = String(generateRandomValue('numeric', 6));
    }

    const key = `${this.NODE_ENV}_${otp}_${secret}`;
    const value = JSON.stringify({ otp, email });

    this.logger.log(
      'OtpService',
      'info',
      `Generated OTP for email: ${email}, key: ${key}`,
      'otp-service'
    );

    await this.cacheService.set(key, value, 6 * 60);

    return { otp, secret };
  }

  async validateOtp(secret: string, otp: any, type: string) {
    try {
      const key = `${this.NODE_ENV}_${otp}_${secret}`;
      const value = await this.cacheService.get(key);

      this.logger.log(
        'OtpService',
        'info',
        `Validating OTP with key: ${key}`,
        'otp-service'
      );

      const { otp: savedOtp, phoneNumber } = JSON.parse(value);
      if (otp == savedOtp) {
        await this.cacheService.delete(key);

        this.logger.log(
          'OtpService',
          'info',
          `OTP validation successful for key: ${key}`,
          'otp-service'
        );

        return { otpIsValid: true, email: phoneNumber };
      }
    } catch (e) {
      this.logger.log(
        'OtpService',
        'error',
        `Error during OTP validation: ${e.message}`,
        'otp-service'
      );
      return { otpIsValid: false, email: null };
    }

    this.logger.log(
      'OtpService',
      'warn',
      `OTP validation failed for secret: ${secret}, otp: ${otp}`,
      'otp-service'
    );

    return { otpIsValid: false, email: null };
  }
}