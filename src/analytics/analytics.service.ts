import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from 'src/auth/entities/user-role.entity';
import { AccountStatus } from 'common/enums/account-status';
import { RolesConstant } from 'common/enums/roles';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async getStudentSummary() {
    try {
      const studentRole = await this.userRoleRepository.findOne({
        where: { name: 'STUDENT' },
      });

      const totalStudents = await this.userRepository.count({
        where: { userRole: { id: studentRole?.id } },
      });

      const verifiedStudents = await this.userRepository.count({
        where: {
          userRole: { id: studentRole?.id },
          isEmailVerified: true,
        },
      });

      return {
        totalStudents,
        verifiedStudents,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch student summary');
    }
  }

  async getBusinessSummary() {
    try {
      const businesses = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.business', 'business')
        .where('user.business IS NOT NULL')
        .getCount();

      return {
        totalBusinessUsers: businesses,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch business summary');
    }
  }

  async getAdminSummary() {
    try {
      const adminRole = await this.userRoleRepository.findOne({
        where: { name: RolesConstant.BUSINESS_ADMIN },
      });

      const totalAdmins = await this.userRepository.count({
        where: { userRole: { id: adminRole?.id } },
      });

      const activeAdmins = await this.userRepository.count({
        where: {
          userRole: { id: adminRole?.id },
          accountStatus: AccountStatus.ACTIVE,
        },
      });

      return {
        totalAdmins,
        activeAdmins,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch admin summary');
    }
  }
}
