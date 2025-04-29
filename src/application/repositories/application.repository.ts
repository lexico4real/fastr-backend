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
        relations: ['job', 'talent'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Some thing went wrong: APPR-ERROR',
      );
    }
  }

  async getMyApplications(
    talentId: string,
    page = 1,
    perPage = 10,
    @Req() req?: Request,
  ) {
    try {
      const skip = (page - 1) * perPage;

      const [result, total] = await this.findAndCount({
        where: { talentId },
        relations: ['job'],
        order: { appliedAt: 'DESC' },
        skip,
        take: perPage,
      });

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong: APPR-ERROR',
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
        'Some thing went wrong: APPR-ERROR',
      );
    }
  }

  async apply(talentId: string, jobId: string): Promise<Application> {

    const existingApplication = await this.findOne({
      where: { jobId, talentId },
    });

    if (existingApplication) {
      throw new ForbiddenException('You have already applied for this job');
    }

    const application = this.create({
      jobId,
      talentId,
    });

    return await this.save(application);
  }

  async updateStatus(application: Application) {
    try {
      return await this.save(application);
    } catch (error) {
      throw new InternalServerErrorException(
        'Some thing went wrong: APPR-ERROR',
      );
    }
  }
}