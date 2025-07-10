import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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
import Logger from 'config/logger';
import { JobStatus } from 'common/enums/job-status';

@Injectable()
export class JobService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(JobRepository)
    private jobRepository: JobRepository,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly cacheService: CacheService,
  ) {}

  async getAllJobs(
    page: number,
    perPage: number,
    filters: {
      title?: string;
      salary?: string;
      location?: string;
      company?: string;
      datePosted?: string;
      requiredSkills?: string[];
      status?: JobStatus;
    },
    req: Request,
  ) {
    try {
      const cacheKey = `explore-jobs:${page}:${perPage}:${JSON.stringify(filters)}`;
      const cachedJobs = await this.cacheService.get(cacheKey);
      if (cachedJobs) {
        return JSON.parse(cachedJobs);
      }
      const jobs = await this.jobRepository.getAllJobs(
        page,
        perPage,
        filters,
        req,
      );
      await this.cacheService.set(cacheKey, JSON.stringify(jobs), 3600);
      return jobs;
    } catch (error) {
      this.logger.log(
        'JobService',
        'error',
        `Failed to fetch jobs: ${error}`,
        'job-service',
      );
      throw error instanceof BadRequestException ||
        error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to fetch jobs');
    }
  }

  async getJobById(jobId: string): Promise<Job> {
    if (!isUUID(jobId)) {
      this.logger.log('JobService', 'warn', 'Invalid Job ID', 'job-service');
      throw new BadRequestException('Invalid Job ID');
    }
    try {
      this.logger.log(
        'JobService',
        'info',
        `Fetching job by ID: ${jobId}`,
        'job-service',
      );
      const job = await this.jobRepository.getJobById(jobId);
      if (!job) {
        this.logger.log('JobService', 'warn', 'Job not found', 'job-service');
        throw new NotFoundException('Job not found');
      }
      return job;
    } catch (error) {
      this.logger.log(
        'JobService',
        'error',
        `Failed to fetch job by ID: ${error}`,
        'job-service',
      );
      throw error instanceof BadRequestException ||
        error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to fetch job by ID');
    }
  }

  async createJob(user: any, createJobDto: CreateJobDto): Promise<Job> {
    try {
      const job = this.jobRepository.create({
        ...createJobDto,
        businessId: user?.profile?.businessId,
      });
      const result = await this.jobRepository.createJob(job);

      const html = `
        <h1>New Job Posting</h1>
        <p>Job Title: ${createJobDto.title}</p>
        <p>Job Description: ${createJobDto.description}</p>
        <p>Job Location: ${createJobDto.location}</p>
        <p>Salary: ${createJobDto.salary}</p>
        <p>Posted by: ${user.id}</p>
        <p>Thank you for using our service!</p>
        <p>Best regards,</p>
        <p>Fastr</p>
      `;
      await this.emailService.sendMail({
        to: user.email,
        subject: 'New Job Posting',
        text: '',
        html,
      });
      const pattern = 'explore-jobs:';
      await this.cacheService.deleteByPattern(pattern);
      return result;
    } catch (error) {
      this.logger.log(
        'JobService',
        'error',
        `Failed to create job: ${error}`,
        'job-service',
      );
      throw new InternalServerErrorException('Failed to create job');
    }
  }

  async updateJob(
    user: any,
    jobId: string,
    updateJobDto: UpdateJobDto,
  ): Promise<Job> {
    try {
      const job = await this.getJobById(jobId);
      if (!job || job.businessId !== user?.profile?.businessId) {
        throw new NotFoundException('Job not found or user not authorized');
      }
      Object.assign(job, updateJobDto);
      const result = await this.jobRepository.updateJob(job);

      const html = `
        <h1>Job Update</h1>
        <p>Job Title: ${updateJobDto.title}</p>
        <p>Job Description: ${updateJobDto.description}</p>
        <p>Job Location: ${updateJobDto.location}</p>
        <p>Salary: ${updateJobDto.salary}</p>
        <p>Updated by: ${user.id}</p>
        <p>Thank you for using our service!</p>
        <p>Best regards,</p>
        <p>Fastr</p>
      `;
      await this.emailService.sendMail({
        to: user.email,
        subject: 'Job Update',
        text: '',
        html,
      });
      const pattern = 'explore-jobs:';
      await this.cacheService.deleteByPattern(pattern);
      return result;
    } catch (error) {
      this.logger.log(
        'JobService',
        'error',
        `Failed to update job: ${error}`,
        'job-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update job');
    }
  }

  async deleteJob(user: any, jobId: string): Promise<void> {
    try {
      this.logger.log(
        'JobService',
        'info',
        `Deleting job with ID: ${jobId}`,
        'job-service',
      );
      const job = await this.getJobById(jobId);
      if (!job || job.businessId !== user.id) {
        this.logger.log(
          'JobService',
          'warn',
          'Job not found or user not authorized',
          'job-service',
        );
        throw new NotFoundException('Job not found or user not authorized');
      }
      await this.jobRepository.deleteJob(job);
      const html = `
        <h1>Job Deletion</h1>
        <p>Job Title: ${job.title}</p>
        <p>Job Description: ${job.description}</p>
        <p>Job Location: ${job.location}</p>
        <p>Salary: ${job.salary}</p>
        <p>Deleted by: ${user.email}</p>
        <p>Thank you for using our service!</p>
        <p>Best regards,</p>
        <p>Fastr</p>
      `;
      await this.emailService.sendMail({
        to: user.email,
        subject: 'Job Deletion',
        text: '',
        html,
      });
      const pattern = 'explore-jobs:';
      await this.cacheService.deleteByPattern(pattern);
    } catch (error) {
      this.logger.log(
        'JobService',
        'error',
        `Failed to delete job: ${error}`,
        'job-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to delete job');
    }
  }

  async getMyJobPostings(page: number, perPage: number, req?: Request) {
    try {
      return await this.jobRepository.getMyJobPostings(page, perPage, req);
    } catch (error) {
      this.logger.log(
        'JobService',
        'error',
        `Failed to fetch job postings: ${error}`,
        'job-service',
      );
      throw new InternalServerErrorException('Failed to fetch job postings');
    }
  }

  async getMyJobApplications(page: number, perPage: number, req?: Request) {
    try {
      return await this.jobRepository.getMyJobApplications(page, perPage, req);
    } catch (error) {
      this.logger.log(
        'JobService',
        'error',
        `Failed to fetch job applications: ${error}`,
        'job-service',
      );
      throw new InternalServerErrorException(
        'Failed to fetch job applications',
      );
    }
  }

  updateJobStatus(user: any, jobId: string, status: string): Promise<Job> {
    return this.updateJob(user, jobId, { status });
  }
}
