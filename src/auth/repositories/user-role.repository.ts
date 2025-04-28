import { FindManyOptions, ILike, Repository } from 'typeorm';
import { BadRequestException, InternalServerErrorException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { generatePagination } from 'common/utils/pagination';
import { AccessDto } from './../dto/access.dto';
import { UserRole } from '../entities/user-role.entity';

export class UserRoleRepository extends Repository<UserRole> {
  constructor(
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {
    super(
      userRoleRepository.target,
      userRoleRepository.manager,
      userRoleRepository.queryRunner,
    );
  }

  async createRole(accessDto: AccessDto): Promise<UserRole> {
    const newRole = this.create(accessDto);
    return await this.save(newRole);
  }

  async getRoleByName(name: string): Promise<UserRole> {
    if (!name) {
      throw new BadRequestException('Role name cannot be empty');
    }

    const role = await this.findOne({ where: { name } });
    if (!role) {
      throw new BadRequestException('No role found with this option');
    }
    return role;
  }

  async getRoleById(id: string): Promise<UserRole> {
    if (!id) {
      throw new BadRequestException('Role name cannot be empty');
    }

    try {
      const role = await this.findOne({ where: { id } });
      if (!role) {
        throw new BadRequestException('No role found with this option');
      }
      return role;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async getAllRoles(
    page = 1,
    perPage = 10,
    search?: string,
    @Req() req?: Request,
  ) {
    try {
      const skip = (page - 1) * perPage;

      const where: FindManyOptions<UserRole>['where'] = search
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