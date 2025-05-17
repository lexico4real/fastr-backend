import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { Repository } from 'typeorm';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Job } from 'src/job/entities/job.entity';
import { User } from 'src/auth/entities/user.entity';
import Logger from 'config/logger';

@Injectable()
export class RatingService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async createRating(jobId: string, raterId: string, dto: CreateRatingDto) {
    try {
      this.logger.log(
        'RatingService',
        'info',
        `Creating rating for jobId: ${jobId}, raterId: ${raterId}`,
        'rating-service',
      );

      const job = await this.jobRepository.findOne({ where: { id: jobId } });
      if (!job) {
        this.logger.log(
          'RatingService',
          'error',
          `Job not found for jobId: ${jobId}`,
          'rating-service',
        );
        throw new NotFoundException('Job not found');
      }

      const ratee = await this.userRepository.findOne({
        where: { id: dto.rateeId },
      });
      if (!ratee) {
        this.logger.log(
          'RatingService',
          'error',
          `Ratee not found for rateeId: ${dto.rateeId}`,
          'rating-service',
        );
        throw new NotFoundException('Ratee not found');
      }

      const rating = this.ratingRepository.create({
        ...dto,
        raterId,
        rateeId: dto.rateeId,
        jobId,
      });

      const savedRating = await this.ratingRepository.save(rating);
      this.logger.log(
        'RatingService',
        'info',
        `Rating created successfully for jobId: ${jobId}`,
        'rating-service',
      );
      return savedRating;
    } catch (error) {
      this.logger.log(
        'RatingService',
        'error',
        `Failed to create rating: ${error.message}`,
        'rating-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to create rating');
    }
  }

  async getRatingsForStudent(studentId: string) {
    try {
      this.logger.log(
        'RatingService',
        'info',
        `Fetching ratings for studentId: ${studentId}`,
        'rating-service',
      );

      const ratings = await this.ratingRepository.find({
        where: { rateeId: studentId },
      });

      this.logger.log(
        'RatingService',
        'info',
        `Fetched ${ratings.length} ratings for studentId: ${studentId}`,
        'rating-service',
      );

      return ratings;
    } catch (error) {
      this.logger.log(
        'RatingService',
        'error',
        `Failed to fetch ratings for studentId: ${studentId}, Error: ${error.message}`,
        'rating-service',
      );
      throw new InternalServerErrorException(
        'Failed to fetch ratings for student',
      );
    }
  }

  async getRatingsForBusiness(businessId: string) {
    try {
      this.logger.log(
        'RatingService',
        'info',
        `Fetching ratings for businessId: ${businessId}`,
        'rating-service',
      );

      const businessUsers = await this.userRepository.find({
        where: { business: { id: businessId } },
      });

      const businessUserIds = businessUsers.map((u) => u.id);
      const ratings = await this.ratingRepository.find({
        where: businessUserIds.map((id) => ({ rateeId: id })),
      });

      this.logger.log(
        'RatingService',
        'info',
        `Fetched ${ratings.length} ratings for businessId: ${businessId}`,
        'rating-service',
      );

      return ratings;
    } catch (error) {
      this.logger.log(
        'RatingService',
        'error',
        `Failed to fetch ratings for businessId: ${businessId}, Error: ${error.message}`,
        'rating-service',
      );
      throw new InternalServerErrorException(
        'Failed to fetch ratings for business',
      );
    }
  }
}
