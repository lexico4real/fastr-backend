import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { Job } from '../entities/job.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { generatePagination } from 'common/utils/pagination';
import { Request } from 'express';
import { JobStatus } from 'common/enums/job-status';

export class JobRepository extends Repository<Job> {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {
    super(
      jobRepository.target,
      jobRepository.manager,
      jobRepository.queryRunner,
    );
  }

  async getJobById(id: string): Promise<Job> {
    try {
      return await this.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong: JR-ERROR');
    }
  }

  async getMyJobApplications(page = 1, perPage = 10, req?: Request) {
    try {
      const skip = (page - 1) * perPage;
      const userId = req.user['id'];

      const [result, total] = await this.createQueryBuilder('job')
        .leftJoinAndSelect('job.applications', 'application')
        .where('application.studentId = :userId', { userId })
        .orderBy('application.appliedAt', 'DESC')
        .skip(skip)
        .take(perPage)
        .getManyAndCount();

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      console.error('Error fetching job applications:', error);
      throw new InternalServerErrorException('Something went wrong: JR-ERROR');
    }
  }

  async getAllJobs(
    page = 1,
    perPage = 10,
    filters: {
      title?: string;
      location?: string;
      salary?: string;
      company?: string;
      datePosted?: string;
      requiredSkills?: string[];
      status?: JobStatus;
    },
    req?: Request,
  ) {
    try {
      const skip = (page - 1) * perPage;

      const query = this.createQueryBuilder('job')
        .leftJoinAndSelect('job.business', 'business')
        .select([
          'job.id',
          'job.title',
          'job.description',
          'job.salary',
          'job.location',
          'job.requiredSkills',
          'job.status',
          'job.closedAt',
          'job.createdAt',
          'business.businessName',
          'business.businessDescription',
        ])
        .where('job.status = :status', { status: JobStatus.OPEN });

      // Title
      if (filters.title) {
        query.andWhere('job.title ILIKE :title', {
          title: `%${filters.title}%`,
        });
      }

      // Location
      if (filters.location) {
        query.andWhere('job.location = :location', {
          location: filters.location,
        });
      }

      // Salary
      if (filters.salary) {
        query.andWhere('job.salary >= :salary', {
          salary: Number(filters.salary),
        });
      }

      // Company name (business.name)
      if (filters.company) {
        query.andWhere('business.name ILIKE :company', {
          company: `%${filters.company}%`,
        });
      }

      // Job Status
      const jobStatus = filters.status ?? JobStatus.OPEN;
      query.andWhere('job.status = :status', { status: jobStatus });

      // Date posted
      if (filters.datePosted) {
        const days = parseInt(filters.datePosted);
        const postedAfter = new Date();
        postedAfter.setDate(postedAfter.getDate() - days);
        query.andWhere('job.createdAt >= :postedAfter', {
          postedAfter,
        });
      }

      // Required Skills
      if (filters.requiredSkills?.length) {
        query.andWhere(`job.requiredSkills @> :skills::jsonb`, {
          skills: JSON.stringify(filters.requiredSkills),
        });
      }

      // Pagination and sorting
      const [result, total] = await query
        .skip(skip)
        .take(perPage)
        .orderBy('job.createdAt', 'DESC')
        .getManyAndCount();

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException('Some thing went wrong: JR-ERROR');
    }
  }

  async updateJob(job: Job): Promise<Job> {
    try {
      return await this.save(job);
    } catch (error) {
      throw new InternalServerErrorException('Some thing went wrong: JR-ERROR');
    }
  }

  async deleteJob(job: Job): Promise<void> {
    try {
      await this.remove(job);
    } catch (error) {
      throw new InternalServerErrorException('Some thing went wrong: JR-ERROR');
    }
  }

  async createJob(job: Job): Promise<Job> {
    try {
      return await this.save(job);
    } catch (error) {
      console.log({ error });
      throw new InternalServerErrorException('Some thing went wrong: JR-ERROR');
    }
  }

  async getMyJobPostings(page = 1, perPage = 10, req?: Request) {
    try {
      const skip = (page - 1) * perPage;

      const businessId = req.user?.['profile']?.businessId;

      const [result, total] = await this.findAndCount({
        where: { businessId },
        order: { createdAt: 'DESC' },
        skip,
        take: perPage,
      });

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong: JR-ERROR');
    }
  }
}