import { Global, Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { CacheModule } from '../cache/cache.module';
import { PassportModule } from '@nestjs/passport';

@Global()
@Module({
  imports: [CacheModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule { }