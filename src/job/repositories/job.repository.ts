import { CreateJobDto } from './../dto/create-job.dto';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { InternalServerErrorException, Req } from '@nestjs/common';
import { Job } from '../entities/job.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { generatePagination } from 'common/utils/pagination';
import { Request } from 'express';

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
      return await this.findOne({ where: { id } })
    } catch (error) {
      throw new InternalServerErrorException(
        'Some thing went wrong: JR-ERROR',
      );
    }
  }

  // async getMyJobApplications(userId: string): Promise<Job[]> {
  //   const jobs = await this.createQueryBuilder('job')
  //     .innerJoin('job.applications', 'application')
  //     .where('application.studentId = :userId', { userId })
  //     .getMany();

  //   return jobs;
  // }

  async getMyJobApplications(
    userId: string,
    page = 1,
    perPage = 10,
    @Req() req?: Request,
  ) {
    try {
      const skip = (page - 1) * perPage;

      const [result, total] = await this.createQueryBuilder('job')
        .innerJoin('job.applications', 'application')
        .where('application.studentId = :userId', { userId })
        .orderBy('job.createdAt', 'DESC')
        .skip(skip)
        .take(perPage)
        .getManyAndCount();

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong: JR-ERROR',
      );
    }
  }

  async getAllJobs(
    page = 1,
    perPage = 10,
    search?: string,
    @Req() req?: Request,
  ) {
    try {
      const skip = (page - 1) * perPage;

      const where: FindManyOptions<Job>['where'] = search
        ? [{ title: ILike(`%${search}%`) }]
        : undefined;

      const [result, total] = await this.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip,
        take: perPage,
      });

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException(
        'Some thing went wrong: JR-ERROR',
      );
    }
  }

  async updateJob(
    job: Job,
  ): Promise<Job> {
    try {
      return await this.save(job);
    } catch (error) {
      throw new InternalServerErrorException(
        'Some thing went wrong: JR-ERROR',
      );
    }
  }

  async deleteJob(job: Job): Promise<void> {
    try {
      await this.remove(job);
    } catch (error) {
      throw new InternalServerErrorException(
        'Some thing went wrong: JR-ERROR',
      );
    }
  }

  async createJob(job: Job): Promise<Job> {
    try {
      return await this.save(job);
    } catch (error) {
      throw new InternalServerErrorException(
        'Some thing went wrong: JR-ERROR',
      );
    }
  }

  // async getMyJobPostings(userId: string): Promise<Job[]> {
  //   return this.jobRepository.find({ where: { businessId: userId } });
  // }
  async getMyJobPostings(
    userId: string,
    page = 1,
    perPage = 10,
    @Req() req?: Request,
  ) {
    try {
      const skip = (page - 1) * perPage;

      const [result, total] = await this.findAndCount({
        where: { businessId: userId },
        order: { createdAt: 'DESC' },
        skip,
        take: perPage,
      });

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong: JR-ERROR',
      );
    }
  }

  
}