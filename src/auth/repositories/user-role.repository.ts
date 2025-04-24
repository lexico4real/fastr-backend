import { AccessDto } from './../dto/access.dto';
import { EntityRepository, Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from '../entities/user-role';

@EntityRepository(UserRole)
export class UserRoleRepository extends Repository<UserRole> {
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
}