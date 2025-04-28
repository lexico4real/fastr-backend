import { Module } from '@nestjs/common';
import { ApplicationsService } from './application.service';
import { ApplicationsController } from './application.controller';
import { JobModule } from 'src/job/job.module';
import { Application } from './entities/application.entity';
import { CacheModule } from 'src/cache/cache.module';
import { EmailModule } from 'src/email/email.module';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationRepository } from './repositories/application.repository';

@Module({
  imports: [
    JobModule,
    CacheModule,
    EmailModule,
    TypeOrmModule.forFeature([Application]),
    PassportModule.register({ defaultStrategy: 'jwt' })
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationRepository],
  exports: [ApplicationsService, TypeOrmModule],
})
export class ApplicationModule { }
