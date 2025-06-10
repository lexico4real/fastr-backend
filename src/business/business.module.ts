import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { Profile } from 'src/profile/entities/profile.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Business, Profile]),
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService, TypeOrmModule],
})
export class BusinessModule {}
