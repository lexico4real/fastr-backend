import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Job } from 'src/job/entities/job.entity';
import { Rating } from './entities/rating.entity';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, Job, User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    CacheModule,
  ],
  controllers: [RatingController],
  providers: [RatingService],
})
export class RatingModule {}
