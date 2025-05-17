import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Invoice } from 'src/payment/entities/invoice.entity';
import { Job } from 'src/job/entities/job.entity';
import { Business } from 'src/business/entities/business.entity';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Invoice, Job, Business]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
