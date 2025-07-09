import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { In, Repository } from 'typeorm';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Job } from 'src/job/entities/job.entity';
import { User } from 'src/auth/entities/user.entity';
import Logger from 'config/logger';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class RatingService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async createRating(jobId: string, raterId: string, dto: CreateRatingDto) {
    if (raterId === dto.rateeId) {
      throw new InternalServerErrorException('You cannot rate yourself');
    }
    try {
      const job = await this.jobRepository.findOne({ where: { id: jobId } });
      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const ratee = await this.userRepository.findOne({
        where: { id: dto.rateeId },
      });
      if (!ratee) {
        throw new NotFoundException('Ratee not found');
      }

      const rating = this.ratingRepository.create({
        ...dto,
        raterId,
        rateeId: dto.rateeId,
        jobId,
      });

      const savedRating = await this.ratingRepository.save(rating);
      await this.cacheService.delete(`student:rating:avg:${dto.rateeId}`);
      return savedRating;
    } catch (error) {
      this.logger.log(
        'RatingService',
        'error',
        `Failed to create rating: ${error}`,
        'rating-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to create rating');
    }
  }

  async getRatingsForStudent(studentId: string) {
    const cacheKey = `student:rating:avg:${studentId}`;
    const cachedAvg = await this.cacheService.get(cacheKey);

    if (cachedAvg) {
      const parsed = JSON.parse(cachedAvg);
      return {
        averageScore: parsed.averageScore,
        ratings: parsed.ratings,
      };
    }

    try {
      const ratings = await this.ratingRepository.find({
        where: { rateeId: studentId },
        select: ['score', 'comment'],
      });

      if (ratings.length === 0) {
        return { averageScore: 0, ratings: [] };
      }

      const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
      const averageScore = totalScore / ratings.length;

      const formattedRatings = ratings.map((rating) => ({
        score: rating.score,
        comment: rating.comment,
      }));

      await this.cacheService.set(
        cacheKey,
        JSON.stringify({ averageScore, ratings: formattedRatings }),
        300,
      );

      return { averageScore, ratings: formattedRatings };
    } catch (error) {
      this.logger.log(
        'RatingService',
        'error',
        `Failed to fetch ratings for studentId: ${studentId}, Error: ${error}`,
        'rating-service',
      );
      throw new InternalServerErrorException(
        'Failed to fetch ratings for student',
      );
    }
  }

  async getRatingsForBusiness(businessId: string) {
    const cacheKey = `business:rating:avg:${businessId}`;
    const cachedAvg = await this.cacheService.get(cacheKey);

    if (cachedAvg) {
      const parsed = JSON.parse(cachedAvg);
      return {
        averageScore: parsed.averageScore,
        ratings: parsed.ratings,
      };
    }

    try {
      const businessUsers = await this.userRepository.find({
        where: { business: { id: businessId } },
        select: ['id'],
      });

      const businessUserIds = businessUsers.map((user) => user.id);

      if (businessUserIds.length === 0) {
        return { averageScore: 0, ratings: [] };
      }

      const ratings = await this.ratingRepository.find({
        where: { rateeId: In(businessUserIds) },
        select: ['score', 'comment'],
      });

      if (ratings.length === 0) {
        return { averageScore: 0, ratings: [] };
      }

      const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
      const averageScore = totalScore / ratings.length;

      const formattedRatings = ratings.map((rating) => ({
        score: rating.score,
        comment: rating.comment,
      }));

      await this.cacheService.set(
        cacheKey,
        JSON.stringify({ averageScore, ratings: formattedRatings }),
        300,
      );

      return { averageScore, ratings: formattedRatings };
    } catch (error) {
      this.logger.log(
        'RatingService',
        'error',
        `Failed to fetch ratings for businessId: ${businessId}, Error: ${error}`,
        'rating-service',
      );
      throw new InternalServerErrorException(
        'Failed to fetch ratings for business',
      );
    }
  }
}
