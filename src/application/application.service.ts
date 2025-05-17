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

@Injectable()
export class ApplicationsService {
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
        throw new NotFoundException('Job not found');
      }
      if (job.businessId === studentId) {
        throw new ForbiddenException('You cannot apply to your own job');
      }
      return await this.applicationRepository.apply(studentId, jobId);
    } catch (error) {
      console.error(error);
      throw error instanceof NotFoundException
        ? error
        : error instanceof ForbiddenException
          ? new ForbiddenException()
          : new InternalServerErrorException('Failed to apply for the job');
    }
  }

  async getApplication(applicationId: string) {
    if (!isUUID(applicationId)) {
      throw new BadRequestException('Invalid Application ID');
    }
    try {
      const application =
        await this.applicationRepository.getApplication(applicationId);
      if (!application) {
        throw new NotFoundException('Application not found');
      }
      return application;
    } catch (error) {
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
        throw new NotFoundException('Application not found');
      }

      application.status = dto.status;
      return await this.applicationRepository.updateStatus(application);
    } catch (error) {
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
      throw new BadRequestException('Invalid Student ID');
    }
    try {
      return await this.applicationRepository.getMyApplications(
        studentId,
        page,
        perPage,
        req,
      );
    } catch (error) {
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

      return generatePagination(page, perPage, total, req, applications);
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong: APPS-ERROR',
      );
    }
  }
}
