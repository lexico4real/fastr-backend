import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { EmailModule } from 'src/email/email.module';
import { PassportModule } from '@nestjs/passport';
import { User } from 'src/auth/entities/user.entity';
import { StripeController } from './stripe.controller';

@Module({
  imports: [
    EmailModule,
    TypeOrmModule.forFeature([Invoice, User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [PaymentController, StripeController],
  providers: [PaymentService],
  exports: [PaymentService, TypeOrmModule],
})
export class PaymentModule { }
