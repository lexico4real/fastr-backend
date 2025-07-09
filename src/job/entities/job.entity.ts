import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/base.enttity';
import { Application } from 'src/application/entities/application.entity';
import { Business } from 'src/business/entities/business.entity';
import { JobStatus } from 'common/enums/job-status';
import { Attendance } from 'src/attendance/entities/attendance.entity';

@Entity()
export class Job extends BaseEntity {
  @Index()
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Index()
  @Column('decimal')
  salary: number;

  @Index()
  @Column({ nullable: true })
  location: string;

  @ManyToOne(() => Business, (business) => business.jobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @OneToMany(() => Application, (application) => application.job, {
    nullable: true,
  })
  applications: Application[];

  @OneToMany(() => Attendance, (attendance) => attendance.job)
  attendances: Attendance[];

  @Column({ type: 'json', nullable: true, default: [] })
  requiredSkills: string[];

  @Index()
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: JobStatus.OPEN })
  status: string;

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;
}