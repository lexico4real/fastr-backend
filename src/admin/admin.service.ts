import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { Job } from 'src/job/entities/job.entity';
import { Invoice } from 'src/payment/entities/invoice.entity';
import { AccountStatus } from 'common/enums/account-status';
import { IdVerificationStatus } from 'common/enums/id-verification-status';
import { Business } from 'src/business/entities/business.entity';
import Logger from 'config/logger';

@Injectable()
export class AdminService {
  private logger: Logger;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Job)
    private jobRepository: Repository<Job>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {
    this.logger = new Logger();
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.find({
        relations: ['userRole', 'profile', 'business'],
      });
    } catch (error) {
      this.logger.log(
        'AdminService',
        'error',
        `Error fetching all users: ${error.message}`,
        'admin-service',
      );
      throw new Error('Failed to fetch users');
    }
  }

  async getAllJobs(): Promise<Job[]> {
    try {
      return await this.jobRepository.find({ relations: ['business'] });
    } catch (error) {
      this.logger.log(
        'AdminService',
        'error',
        `Error fetching all jobs: ${error.message}`,
        'admin-service',
      );
      throw new Error('Failed to fetch jobs');
    }
  }

  async getAllTransactions(): Promise<Invoice[]> {
    try {
      return await this.invoiceRepository.find({
        relations: ['businesses', 'users'],
      });
    } catch (error) {
      this.logger.log(
        'AdminService',
        'error',
        `Error fetching all transactions: ${error.message}`,
        'admin-service',
      );
      throw new Error('Failed to fetch transactions');
    }
  }

  async verifyStudent(studentId: string): Promise<boolean> {
    try {
      const student = await this.userRepository.findOne({
        where: { id: studentId },
      });
      if (!student) return false;

      student.accountStatus = AccountStatus.ACTIVE;
      await this.userRepository.save(student);
      return true;
    } catch (error) {
      this.logger.log(
        'AdminService',
        'error',
        `Error verifying student: ${error.message}`,
        'admin-service',
      );
      throw new Error('Failed to verify student');
    }
  }

  async verifyBusiness(businessId: string): Promise<boolean> {
    try {
      return await this.updateBusinessVerificationStatus(
        businessId,
        IdVerificationStatus.APPROVED,
      );
    } catch (error) {
      this.logger.log(
        'AdminService',
        'error',
        `Error verifying business: ${error.message}`,
        'admin-service',
      );
      throw new Error('Failed to verify business');
    }
  }

  private async updateBusinessVerificationStatus(
    id: string,
    status: IdVerificationStatus,
  ): Promise<boolean> {
    try {
      const business = await this.businessRepository.findOne({
        where: { id },
      });
      if (!business) return false;

      business.verificationStatus = status;
      await this.jobRepository.manager.save(business);
      return true;
    } catch (error) {
      this.logger.log(
        'AdminService',
        'error',
        `Error updating business verification status: ${error.message}`,
        'admin-service',
      );
      throw new Error('Failed to update business verification status');
    }
  }
}
