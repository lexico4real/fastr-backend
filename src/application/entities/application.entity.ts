import { Entity, ManyToOne, JoinColumn, Column } from "typeorm";
import { User } from "src/auth/entities/user.entity";
import { Job } from "src/job/entities/job.entity";
import { BaseEntity } from "src/base.enttity";
import { ApplicationStatus } from "common/enums/application-status";

@Entity('applications')
export class Application extends BaseEntity {
  @ManyToOne(() => Job, job => job.applications)
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @ManyToOne(() => User, user => user.applications)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  jobId: string;

  @Column()
  studentId: string;

  @Column({ default: ApplicationStatus.PENDING })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt: Date;
}