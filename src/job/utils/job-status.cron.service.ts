import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from '../entities/job.entity';

@Injectable()
export class JobStatusCronService {
  private readonly logger = new Logger(JobStatusCronService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleJobStatusUpdate() {
    this.logger.log('Running job status update cron...');

    const now = new Date();

    const jobsToUpdate = await this.jobRepository.find({
      where: {
        closedAt: LessThanOrEqual(now),
        isActive: true,
      },
    });

    if (jobsToUpdate.length === 0) {
      this.logger.log('No jobs need to be deactivated.');
      return;
    }

    for (const job of jobsToUpdate) {
      job.isActive = false;
    }

    await this.jobRepository.save(jobsToUpdate);

    this.logger.log(`Deactivated ${jobsToUpdate.length} expired job(s).`);
  }
}
