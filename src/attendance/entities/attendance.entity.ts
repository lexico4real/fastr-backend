import { BaseEntity } from "src/base.enttity";
import { Job } from "src/job/entities/job.entity";
import { Entity, ManyToOne, Column, Unique, Index } from "typeorm";

@Entity()
@Unique(['job', 'userId', 'clockOut'])
export class Attendance extends BaseEntity {
  @ManyToOne(() => Job, (job) => job.attendances)
  job: Job;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'timestamp', nullable: true })
  clockIn: Date;

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  clockOut: Date;

  @Column({ default: 'NA' })
  clockInOtp: string;

  @Column({ default: 'NA' })
  clockOutOtp: string;

  @Column({ default: 'NA' })
  clockInOtpSecret: string;

  @Column({ default: 'NA' })
  clockOutOtpSecret: string;

  @Column({ type: 'timestamp', nullable: true })
  clockInOtpExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  clockOutOtpExpiresAt: Date;
}
