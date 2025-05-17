import { BaseEntity } from "src/base.enttity";
import { Job } from "src/job/entities/job.entity";
import { Entity, ManyToOne, Column, Unique } from "typeorm";

@Entity()
@Unique(['job', 'userId', 'clockOut'])
export class Attendance extends BaseEntity {
  @ManyToOne(() => Job, (job) => job.attendances)
  job: Job;

  @Column()
  userId: string;

  @Column({ type: 'timestamp' })
  clockIn: Date;

  @Column({ type: 'timestamp', nullable: true })
  clockOut: Date;

  @Column({ default: 'NA' })
  otp: string;

  @Column({ default: 'NA' })
  otpSecret: string;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt: Date;
}
