import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/base.enttity';
import { Application } from 'src/application/entities/application.entity';
import { Business } from 'src/business/entities/business.entity';
import { JobStatus } from 'common/enums/job-status';

@Entity()
export class Job extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column('decimal')
  salary: number;

  @Column({ nullable: true })
  location: string;

  @ManyToOne(() => Business, business => business.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @OneToMany(() => Application, application => application.job, { nullable: true })
  applications: Application[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: JobStatus.OPEN })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;
}