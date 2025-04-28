import { BadRequestException, Injectable, NotFoundException, Req } from '@nestjs/common';
import { Request } from 'express';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobRepository } from './repositories/job.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService } from 'src/email/email.service';
import { OtpService } from 'src/otp/otp.service';
import { CacheService } from 'src/cache/cache.service';
import { Job } from './entities/job.entity';
import { isUUID } from 'class-validator';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(JobRepository)
    private jobRepository: JobRepository,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly cacheService: CacheService
  ) { }

  async getAllJobs(
    page: number,
    perPage: number,
    search: string,
    @Req() req: Request
  ) {
    return await this.jobRepository.getAllJobs(page, perPage, search, req);
  }

  async getJobById(jobId: string): Promise<Job> {
    if (!isUUID(jobId)) {
      throw new BadRequestException('Invalid Job ID');
    }
    const job = await this.jobRepository.getJobById(jobId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async createJob(userId: string, createJobDto: CreateJobDto): Promise<Job> {
    const job = this.jobRepository.create({
      ...createJobDto,
      businessId: userId,
    });
    return await this.jobRepository.createJob(job);
  }

  async updateJob(
    userId: string,
    jobId: string,
    updateJobDto: UpdateJobDto,
  ): Promise<Job> {
    const job = await this.getJobById(jobId);
    if (!job || job.businessId !== userId) {
      throw new NotFoundException('Job not found or user not authorized');
    }
    Object.assign(job, updateJobDto);
    return await this.jobRepository.updateJob(job);
  }

  async deleteJob(userId: string, jobId: string): Promise<void> {
    const job = await this.getJobById(jobId);
    if (!job || job.businessId !== userId) {
      throw new NotFoundException('Job not found or user not authorized');
    }
    await this.jobRepository.deleteJob(job);
  }

  async getMyJobPostings(
    userId: string,
    page: number,
    perPage: number,
    @Req() req?: Request,
  ) {
    return this.jobRepository.getMyJobPostings(userId, page, perPage, req);
  }

  async getMyJobApplications(
    userId: string,
    page: number,
    perPage: number,
    @Req() req?: Request,
  ){
    return this.jobRepository.getMyJobApplications(userId, page, perPage, req);
  }
}
