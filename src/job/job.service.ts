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

  async createJob(user: any, createJobDto: CreateJobDto): Promise<Job> {
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
    })
    return result;
  }

  async updateJob(
    user: any,
    jobId: string,
    updateJobDto: UpdateJobDto,
  ): Promise<Job> {
    const job = await this.getJobById(jobId);
    if (!job || job.businessId !== user.id) {
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
    })
    return result;
  }

  async deleteJob(user: any, jobId: string): Promise<void> {
    const job = await this.getJobById(jobId);
    if (!job || job.businessId !== user.id) {
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
    })
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
