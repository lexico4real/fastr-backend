import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/base.enttity';
import { Job } from 'src/job/entities/job.entity';
import { User } from 'src/auth/entities/user.entity';

@Entity('ratings')
export class Rating extends BaseEntity {
  @Index()
  @Column('int')
  score: number;

  @Index()
  @Column({ nullable: true })
  comment: string;

  @ManyToOne(() => User, user => user.ratingsGiven, { eager: true })
  @JoinColumn({ name: 'raterId' })
  rater: User;

  @Column()
  raterId: string;

  @ManyToOne(() => User, user => user.ratingsReceived, { eager: true })
  @JoinColumn({ name: 'rateeId' })
  ratee: User;

  @Column()
  rateeId: string;

  @ManyToOne(() => Job, { eager: true })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @Column()
  jobId: string;
}
