import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { UserRole } from 'src/auth/entities/user-role.entity';
import { AccountStatus } from 'common/enums/account-status';
import { RolesConstant } from 'common/enums/roles';
import Logger from 'config/logger';

@Injectable()
export class AnalyticsService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {
    this.logger = new Logger();
  }

  async getStudentSummary() {
    try {
      this.logger.log('AnalyticsService', 'info', 'Fetching student summary', 'analytics');

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

      this.logger.log('AnalyticsService', 'info', 'Successfully fetched student summary', 'analytics');

      return {
        totalStudents,
        verifiedStudents,
      };
    } catch (error) {
      this.logger.log('AnalyticsService', 'error', `Error fetching student summary: ${error.message}`, 'analytics');
      throw new InternalServerErrorException('Failed to fetch student summary');
    }
  }

  async getBusinessSummary() {
    try {
      this.logger.log('AnalyticsService', 'info', 'Fetching business summary', 'analytics');
      
      const businesses = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.business', 'business')
        .where('user.business IS NOT NULL')
        .getCount();

      this.logger.log('AnalyticsService', 'info', 'Successfully fetched business summary', 'analytics');

      return {
        totalBusinessUsers: businesses,
      };
    } catch (error) {
      this.logger.log('AnalyticsService', 'error', `Error fetching business summary: ${error.message}`, 'analytics');
      throw new InternalServerErrorException('Failed to fetch business summary');
    }
  }

  async getAdminSummary() {
    try {
      this.logger.log('AnalyticsService', 'info', 'Fetching admin summary', 'analytics');
      
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

      this.logger.log('AnalyticsService', 'info', 'Successfully fetched admin summary', 'analytics');

      return {
        totalAdmins,
        activeAdmins,
      };
    } catch (error) {
      this.logger.log('AnalyticsService', 'error', `Error fetching admin summary: ${error.message}`, 'analytics');
      throw new InternalServerErrorException('Failed to fetch admin summary');
    }
  }
}
