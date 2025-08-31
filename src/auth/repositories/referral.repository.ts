import { FindManyOptions, ILike, Repository } from 'typeorm';
import { BadRequestException, InternalServerErrorException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { generatePagination } from 'common/utils/pagination';
import { ReferralSource } from '../entities/referral-source.entity';
import { CreateReferralSourceDto } from '../dto/create-referral-source.dto';

export class ReferralSourceRepository extends Repository<ReferralSource> {
  constructor(
    @InjectRepository(ReferralSource)
    private referralSourceRepository: Repository<ReferralSource>,
  ) {
    super(
      referralSourceRepository.target,
      referralSourceRepository.manager,
      referralSourceRepository.queryRunner,
    );
  }

  async createReferralSource(createReferralSourceDto: CreateReferralSourceDto): Promise<ReferralSource> {
    const newReferralSource = this.create(createReferralSourceDto);
    return await this.save(newReferralSource);
  }

  async getReferralSourceByName(name: string): Promise<ReferralSource> {
    if (!name) {
      throw new BadRequestException('ReferralSource name cannot be empty');
    }

    const referralSource = await this.findOne({ where: { name } });
    if (!referralSource) {
      throw new BadRequestException('No referralSource found with this option');
    }
    return referralSource;
  }

  async getReferralSourceById(id: string): Promise<ReferralSource> {
    if (!id) {
      throw new BadRequestException('ReferralSource name cannot be empty');
    }

    try {
      const referralSource = await this.findOne({ where: { id } });
      if (!referralSource) {
        throw new BadRequestException('No referralSource found with this option');
      }
      return referralSource;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async getAllReferralSources(page = 1, perPage = 10, search?: string, req?: Request) {
    try {
      const skip = (page - 1) * perPage;

      const where: FindManyOptions<ReferralSource>['where'] = search
        ? [{ name: ILike(`%${search}%`) }]
        : undefined;

      const [result, total] = await this.findAndCount({
        where,
        order: { name: 'DESC' },
        skip,
        take: perPage,
      });

      return generatePagination(page, perPage, total, req, result);
    } catch (error) {
      throw new InternalServerErrorException(
        'Some thing went wrong: UPR-ERROR',
      );
    }
  }
}