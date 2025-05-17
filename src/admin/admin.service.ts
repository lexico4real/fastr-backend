import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { Job } from 'src/job/entities/job.entity';
import { Invoice } from 'src/payment/entities/invoice.entity';
import { AccountStatus } from 'common/enums/account-status';
import { IdVerificationStatus } from 'common/enums/id-verification-status';
import { Business } from 'src/business/entities/business.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Job)
    private jobRepository: Repository<Job>,

    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {}

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.find({
        relations: ['userRole', 'profile', 'business'],
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async getAllJobs(): Promise<Job[]> {
    try {
      return await this.jobRepository.find({ relations: ['business'] });
    } catch (error) {
      console.error('Error fetching all jobs:', error);
      throw new Error('Failed to fetch jobs');
    }
  }

  async getAllTransactions(): Promise<Invoice[]> {
    try {
      return await this.invoiceRepository.find({
        relations: ['businesses', 'users'],
      });
    } catch (error) {
      console.error('Error fetching all transactions:', error);
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
      console.error('Error verifying student:', error);
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
      console.error('Error verifying business:', error);
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
      console.error('Error updating business verification status:', error);
      throw new Error('Failed to update business verification status');
    }
  }
}
