import { FindManyOptions, ILike, Repository } from 'typeorm';
import { ForbiddenException, InternalServerErrorException, Req } from '@nestjs/common';
import { Application } from '../entities/application.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { generatePagination } from 'common/utils/pagination';
import { Request } from 'express';

export class ApplicationRepository extends Repository<Application> {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
  ) {
    super(
      applicationRepository.target,
      applicationRepository.manager,
      applicationRepository.queryRunner,
    );
  }

  async getApplication(applicationId: string): Promise<Application> {
    try {
      return await this.findOne({
        where: { id: applicationId },
        relations: ['job', 'student'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong: APPR-ERROR',
      );
    }
  }

  async getMyApplications(
    page = 1,
    perPage = 10,
    @Req() req?: Request,
  ) {
    try {
      const studentId = req.user['id'];
      const skip = (page - 1) * perPage;

      const [result, total] = await this.findAndCount({
        where: { studentId },
        relations: ['job'],
        order: { appliedAt: 'DESC' },
        skip,
        take: perPage,
      });

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve applications',
      );
    }
  }

  async getAllApplications(
    page = 1,
    perPage = 10,
    search?: string,
    @Req() req?: Request,
  ) {
    try {
      const skip = (page - 1) * perPage;

      const where: FindManyOptions<Application>['where'] = search
        ? [{ status: ILike(`%${search}%`) }]
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
        'Failed to retrieve applications',
      );
    }
  }

  async apply(student: any, job: any): Promise<Application> {

    const existingApplication = await this.findOne({
      where: { jobId: job?.id, studentId: student?.id },
    });

    if (existingApplication) {
      throw new ForbiddenException('You have already applied for this job');
    }

    try {
      const application = this.create({
        job,
        student,
      });

      return await this.save(application);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create application',
      );
    }
  }

  async updateStatus(application: Application) {
    try {
      return await this.save(application);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update application status',
      );
    }
  }
}