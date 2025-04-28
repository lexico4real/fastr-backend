import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/base.enttity';
import { User } from 'src/auth/entities/user.entity';
import { Application } from 'src/application/entities/application.entity';

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

  @ManyToOne(() => User, user => user.jobs, { nullable: false })
  @JoinColumn({ name: 'businessId' })
  business: User;

  @Column()
  businessId: string;

  @OneToMany(() => Application, application => application.job, { nullable: true })
  applications: Application[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;
}