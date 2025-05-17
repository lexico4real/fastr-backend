import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { Repository } from 'typeorm';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Job } from 'src/job/entities/job.entity';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating) private ratingRepository: Repository<Rating>,
    @InjectRepository(Job) private jobRepository: Repository<Job>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async createRating(jobId: string, raterId: string, dto: CreateRatingDto) {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const ratee = await this.userRepository.findOne({ where: { id: dto.rateeId } });
    if (!ratee) throw new NotFoundException('Ratee not found');

    const rating = this.ratingRepository.create({
      ...dto,
      raterId,
      rateeId: dto.rateeId,
      jobId,
    });

    return this.ratingRepository.save(rating);
  }

  async getRatingsForStudent(studentId: string) {
    return this.ratingRepository.find({ where: { rateeId: studentId } });
  }

  async getRatingsForBusiness(businessId: string) {
    const businessUsers = await this.userRepository.find({
      where: { business: { id: businessId } },
    });

    const businessUserIds = businessUsers.map(u => u.id);
    return this.ratingRepository.find({
      where: businessUserIds.map(id => ({ rateeId: id })),
    });
  }
}
