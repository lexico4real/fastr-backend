import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Req,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { ApplyDto } from './dto/apply.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { Job } from 'src/job/entities/job.entity';
import { ApplicationRepository } from './repositories/application.repository';
import { generatePagination } from 'common/utils/pagination';
import { isUUID } from 'class-validator';
import Logger from 'config/logger';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(ApplicationRepository)
    private readonly applicationRepository: ApplicationRepository,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  async apply(studentId: string, applyDto: ApplyDto) {
    try {
      const { jobId } = applyDto;

      const job = await this.jobRepository.findOne({ where: { id: jobId } });
      if (!job) {
        this.logger.log('ApplicationsService', 'error', 'Job not found', 'application-service');
        throw new NotFoundException('Job not found');
      }
      if (job.businessId === studentId) {
        this.logger.log('ApplicationsService', 'error', 'You cannot apply to your own job', 'application-service');
        throw new ForbiddenException('You cannot apply to your own job');
      }
      this.logger.log('ApplicationsService', 'info', `Student ${studentId} applied to job ${jobId}`, 'application-service');
      return await this.applicationRepository.apply(studentId, jobId);
    } catch (error) {
      this.logger.log('ApplicationsService', 'error', error.message, 'application-service');
      throw error instanceof NotFoundException
        ? error
        : error instanceof ForbiddenException
          ? new ForbiddenException()
          : new InternalServerErrorException('Failed to apply for the job');
    }
  }

  async getApplication(applicationId: string) {
    if (!isUUID(applicationId)) {
      this.logger.log('ApplicationsService', 'error', 'Invalid Application ID', 'application-service');
      throw new BadRequestException('Invalid Application ID');
    }
    try {
      const application =
        await this.applicationRepository.getApplication(applicationId);
      if (!application) {
        this.logger.log('ApplicationsService', 'error', 'Application not found', 'application-service');
        throw new NotFoundException('Application not found');
      }
      this.logger.log('ApplicationsService', 'info', `Retrieved application ${applicationId}`, 'application-service');
      return application;
    } catch (error) {
      this.logger.log('ApplicationsService', 'error', error.message, 'application-service');
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(
            'Failed to retrieve the application',
          );
    }
  }

  async updateStatus(applicationId: string, dto: UpdateApplicationStatusDto) {
    try {
      const application =
        await this.applicationRepository.getApplication(applicationId);
      if (!application) {
        this.logger.log('ApplicationsService', 'error', 'Application not found', 'application-service');
        throw new NotFoundException('Application not found');
      }

      application.status = dto.status;
      this.logger.log('ApplicationsService', 'info', `Updated status of application ${applicationId} to ${dto.status}`, 'application-service');
      return await this.applicationRepository.updateStatus(application);
    } catch (error) {
      this.logger.log('ApplicationsService', 'error', error.message, 'application-service');
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(
            'Failed to update application status',
          );
    }
  }

  async getMyApplications(
    studentId: string,
    page: number,
    perPage: number,
    @Req() req?: Request,
  ) {
    if (!isUUID(studentId)) {
      this.logger.log('ApplicationsService', 'error', 'Invalid Student ID', 'application-service');
      throw new BadRequestException('Invalid Student ID');
    }
    try {
      const applications = await this.applicationRepository.getMyApplications(
        studentId,
        page,
        perPage,
        req,
      );
      this.logger.log('ApplicationsService', 'info', `Retrieved applications for student ${studentId}`, 'application-service');
      return applications;
    } catch (error) {
      this.logger.log('ApplicationsService', 'error', error.message, 'application-service');
      throw new InternalServerErrorException('Failed to retrieve applications');
    }
  }

  async getReceivedApplications(
    businessId: string,
    page = 1,
    perPage = 10,
    @Req() req?: Request,
  ) {
    if (!isUUID(businessId)) {
      this.logger.log('ApplicationsService', 'error', 'Invalid Business ID', 'application-service');
      throw new BadRequestException('Invalid Business ID');
    }
    try {
      const skip = (page - 1) * perPage;

      const [jobs, total] = await this.jobRepository.findAndCount({
        where: { businessId },
        relations: ['applications', 'applications.student'],
        order: { createdAt: 'DESC' },
        skip,
        take: perPage,
      });

      const applications = jobs.flatMap((job) => job.applications);

      this.logger.log('ApplicationsService', 'info', `Retrieved received applications for business ${businessId}`, 'application-service');
      return generatePagination(page, perPage, total, req, applications);
    } catch (error) {
      this.logger.log('ApplicationsService', 'error', error.message, 'application-service');
      throw new InternalServerErrorException(
        'Something went wrong: APPS-ERROR',
      );
    }
  }
}
