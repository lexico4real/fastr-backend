import { AccessDto } from './../dto/access.dto';
import { EntityRepository, Repository, FindManyOptions, ILike } from 'typeorm';
import { Request } from 'express';
import { InternalServerErrorException, Req } from '@nestjs/common';
import { UserPrivilege } from '../entities/user-privilege.entity';
import { generatePagination } from 'common/utils/pagination';
import { InjectRepository } from '@nestjs/typeorm';

export class UserPrivilegeRepository extends Repository<UserPrivilege> {
  constructor(
    @InjectRepository(UserPrivilege)
    private userPrivilegeRepository: Repository<UserPrivilege>,
  ) {
    super(
      userPrivilegeRepository.target,
      userPrivilegeRepository.manager,
      userPrivilegeRepository.queryRunner,
    );
  }

  async createPrivilege(accessDto: AccessDto): Promise<UserPrivilege> {
    const newPrivilege = this.create(accessDto);
    return await this.save(newPrivilege);
  }

  async getAllPrivileges(
    page = 1,
    perPage = 10,
    search: string,
    @Req() req: Request,
  ) {
    try {
      const skip = (page - 1) * perPage;

      const where: FindManyOptions<UserPrivilege>['where'] = search
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