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
    return this.userRepository.find({
      relations: ['userRole', 'profile', 'business'],
    });
  }

  async getAllJobs(): Promise<Job[]> {
    return this.jobRepository.find({ relations: ['business'] });
  }

  async getAllTransactions(): Promise<Invoice[]> {
    return this.invoiceRepository.find({ relations: ['business', 'student'] });
  }

  async verifyStudent(studentId: string): Promise<boolean> {
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });
    if (!student) return false;

    student.accountStatus = AccountStatus.ACTIVE;
    await this.userRepository.save(student);
    return true;
  }

  async verifyBusiness(businessId: string): Promise<boolean> {
    return this.updateBusinessVerificationStatus(
      businessId,
      IdVerificationStatus.APPROVED,
    );
  }

  private async updateBusinessVerificationStatus(
    id: string,
    status: IdVerificationStatus,
  ): Promise<boolean> {
    const business = await this.businessRepository.findOne({
      where: { id },
    });
    if (!business) return false;

    business.verificationStatus = status;
    await this.jobRepository.manager.save(business);
    return true;
  }
}
