import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Req,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ApplyDto } from './dto/apply.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { Job } from 'src/job/entities/job.entity';
import { ApplicationRepository } from './repositories/application.repository';
import { generatePagination } from 'common/utils/pagination';
import { isUUID } from 'class-validator';
import Logger from 'config/logger';
import { renderEmailTemplate } from 'common/templates/renders/render-email-template';
import { EmailService } from 'src/email/email.service';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(ApplicationRepository)
    private readonly applicationRepository: ApplicationRepository,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly emailService: EmailService,
    private readonly cacheService: CacheService,
  ) {}

  async apply(student: any, applyDto: ApplyDto) {
    try {
      const { jobId } = applyDto;

      const job = await this.jobRepository.findOne({ where: { id: jobId } });
      if (!job) {
        throw new NotFoundException('Job not found');
      }
      if (job.businessId === student?.id) {
        throw new ForbiddenException('You cannot apply to your own job');
      }

      const action = await this.applicationRepository.apply(student, job);

      const pattern = `applications:${student.id}`;
      await this.cacheService.deleteByPattern(pattern);

      this.sendConfirmationEmail(student.email, job).catch((emailError) => {
        this.logger.log(
          'ApplicationsService',
          'warn',
          emailError,
          'email-service',
        );
      });

      return action;
    } catch (error) {
      this.logger.log(
        'ApplicationsService',
        'error',
        error,
        'application-service',
      );
      throw error instanceof NotFoundException
        ? error
        : error instanceof ForbiddenException
          ? error
          : new InternalServerErrorException('Failed to apply for the job');
    }
  }

  async getApplication(applicationId: string) {
    if (!isUUID(applicationId)) {
      this.logger.log(
        'ApplicationsService',
        'error',
        'Invalid Application ID',
        'application-service',
      );
      throw new BadRequestException('Invalid Application ID');
    }
    try {
      const application =
        await this.applicationRepository.getApplication(applicationId);
      if (!application) {
        this.logger.log(
          'ApplicationsService',
          'error',
          'Application not found',
          'application-service',
        );
        throw new NotFoundException('Application not found');
      }
      this.logger.log(
        'ApplicationsService',
        'info',
        `Retrieved application ${applicationId}`,
        'application-service',
      );
      return application;
    } catch (error) {
      this.logger.log(
        'ApplicationsService',
        'error',
        error,
        'application-service',
      );
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
        this.logger.log(
          'ApplicationsService',
          'error',
          'Application not found',
          'application-service',
        );
        throw new NotFoundException('Application not found');
      }

      application.status = dto.status;
      this.logger.log(
        'ApplicationsService',
        'info',
        `Updated status of application ${applicationId} to ${dto.status}`,
        'application-service',
      );
      return await this.applicationRepository.updateStatus(application);
    } catch (error) {
      this.logger.log(
        'ApplicationsService',
        'error',
        error,
        'application-service',
      );
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(
            'Failed to update application status',
          );
    }
  }

  async getMyApplications(page: number, perPage: number, req?: Request) {
    const studentId = req.user['id'];
    try {
      // check if data is cached
      const cacheKey = `applications:${studentId}:${page}:${perPage}`;
      const cachedApplications = await this.cacheService.get(
        `applications:${cacheKey}`,
      );
      if (cachedApplications) {
        return JSON.parse(cachedApplications);
      }
      const applications = await this.applicationRepository.getMyApplications(
        page,
        perPage,
        req,
      );

      await this.cacheService.set(
        `applications:${studentId}`,
        JSON.stringify(applications),
        60 * 60 * 24,
      );
      return applications;
    } catch (error) {
      this.logger.log(
        'ApplicationsService',
        'error',
        error,
        'application-service',
      );
      throw new InternalServerErrorException('Failed to retrieve applications');
    }
  }

  async getReceivedApplications(page = 1, perPage = 10, req?: Request) {
    try {
      const skip = (page - 1) * perPage;

      const businessId = req.user?.['profile']?.businessId;
      if (!businessId) {
        throw new UnauthorizedException('User not authenticated');
      }

      const [applications, total] =
        await this.applicationRepository.findAndCount({
          where: {
            job: { businessId },
          },
          relations: ['job', 'student'],
          order: { appliedAt: 'DESC' },
          skip,
          take: perPage,
        });

      // const applications = applications.flatMap((job) => job.applications);

      return generatePagination(page, perPage, total, req, applications);
    } catch (error) {
      this.logger.log(
        'ApplicationsService',
        'error',
        error,
        'application-service',
      );
      throw error instanceof UnauthorizedException
        ? error
        : new InternalServerErrorException(
            'Failed to retrieve received applications',
          );
    }
  }

  private async sendConfirmationEmail(email: string, job: any) {
    const template = fs.readFileSync(
      path.join(__dirname, 'job-confirmation.html'),
      'utf8',
    );

    const renderedHtml = renderEmailTemplate(template, {
      jobTitle: job.title,
      companyName: job.business.businessName,
      supportEmail: 'support@fastr.com',
      year: new Date().getFullYear(),
    });

    await this.emailService.sendMail({
      to: email,
      subject: 'Application Received',
      text: '',
      html: renderedHtml,
    });
  }
}
