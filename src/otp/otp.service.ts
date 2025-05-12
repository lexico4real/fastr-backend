import { Injectable } from '@nestjs/common';
import { CacheService } from './../cache/cache.service';
import { OtpDto } from './otp.dto';
import { generateRandomValue } from 'common/utils/generate-numbers';

@Injectable()
export class OtpService {
  constructor(private readonly cacheService: CacheService) { }
  private NODE_ENV = process.env.NODE_ENV;

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
    await this.cacheService.set(key, value, 6 * 60);

    return { otp, secret };
  }

  async validateOtp(secret: string, otp: any, type: string) {
    try {
      const key = `${this.NODE_ENV}_${otp}_${secret}`;
      const value = await this.cacheService.get(key);
      const { otp: savedOtp, phoneNumber } = JSON.parse(value);
      if (otp == savedOtp) {
        await this.cacheService.delete(key);
        return { otpIsValid: true, email: phoneNumber };
      }
    } catch (e) {
      return { otpIsValid: false, email: null };
    }
    return { otpIsValid: false, email: null };
  }
}