import { BadRequestException, Injectable, NotFoundException, Req, InternalServerErrorException } from '@nestjs/common';
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

@Injectable()
export class JobService {
  private readonly logger = new Logger();

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
    try {
      this.logger.log('JobService', 'info', 'Fetching all jobs', 'job-service');
      return await this.jobRepository.getAllJobs(page, perPage, search, req);
    } catch (error) {
      this.logger.log('JobService', 'error', `Failed to fetch jobs: ${error.message}`, 'job-service');
      throw new InternalServerErrorException('Failed to fetch jobs');
    }
  }

  async getJobById(jobId: string): Promise<Job> {
    if (!isUUID(jobId)) {
      this.logger.log('JobService', 'warn', 'Invalid Job ID', 'job-service');
      throw new BadRequestException('Invalid Job ID');
    }
    try {
      this.logger.log('JobService', 'info', `Fetching job by ID: ${jobId}`, 'job-service');
      const job = await this.jobRepository.getJobById(jobId);
      if (!job) {
        this.logger.log('JobService', 'warn', 'Job not found', 'job-service');
        throw new NotFoundException('Job not found');
      }
      return job;
    } catch (error) {
      this.logger.log('JobService', 'error', `Failed to fetch job by ID: ${error.message}`, 'job-service');
      throw error instanceof BadRequestException || error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to fetch job by ID');
    }
  }

  async createJob(user: any, createJobDto: CreateJobDto): Promise<Job> {
    try {
      this.logger.log('JobService', 'info', `Creating job for user: ${user.id}`, 'job-service');
      const job = this.jobRepository.create({
        ...createJobDto,
        businessId: user.id,
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
      return result;
    } catch (error) {
      this.logger.log('JobService', 'error', `Failed to create job: ${error.message}`, 'job-service');
      throw new InternalServerErrorException('Failed to create job');
    }
  }

  async updateJob(
    user: any,
    jobId: string,
    updateJobDto: UpdateJobDto,
  ): Promise<Job> {
    try {
      this.logger.log('JobService', 'info', `Updating job with ID: ${jobId}`, 'job-service');
      const job = await this.getJobById(jobId);
      if (!job || job.businessId !== user.id) {
        this.logger.log('JobService', 'warn', 'Job not found or user not authorized', 'job-service');
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
      return result;
    } catch (error) {
      this.logger.log('JobService', 'error', `Failed to update job: ${error.message}`, 'job-service');
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update job');
    }
  }

  async deleteJob(user: any, jobId: string): Promise<void> {
    try {
      this.logger.log('JobService', 'info', `Deleting job with ID: ${jobId}`, 'job-service');
      const job = await this.getJobById(jobId);
      if (!job || job.businessId !== user.id) {
        this.logger.log('JobService', 'warn', 'Job not found or user not authorized', 'job-service');
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
    } catch (error) {
      this.logger.log('JobService', 'error', `Failed to delete job: ${error.message}`, 'job-service');
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to delete job');
    }
  }

  async getMyJobPostings(
    userId: string,
    page: number,
    perPage: number,
    @Req() req?: Request,
  ) {
    try {
      this.logger.log('JobService', 'info', `Fetching job postings for user: ${userId}`, 'job-service');
      return await this.jobRepository.getMyJobPostings(userId, page, perPage, req);
    } catch (error) {
      this.logger.log('JobService', 'error', `Failed to fetch job postings: ${error.message}`, 'job-service');
      throw new InternalServerErrorException('Failed to fetch job postings');
    }
  }

  async getMyJobApplications(
    userId: string,
    page: number,
    perPage: number,
    @Req() req?: Request,
  ) {
    try {
      this.logger.log('JobService', 'info', `Fetching job applications for user: ${userId}`, 'job-service');
      return await this.jobRepository.getMyJobApplications(userId, page, perPage, req);
    } catch (error) {
      this.logger.log('JobService', 'error', `Failed to fetch job applications: ${error.message}`, 'job-service');
      throw new InternalServerErrorException('Failed to fetch job applications');
    }
  }
}
