import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { PassportModule } from '@nestjs/passport';

@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}