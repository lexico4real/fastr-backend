import { AccountStatus } from 'common/enums/account-status';
import { BaseEntity } from 'src/base.enttity';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './user-role.entity';
import { Job } from 'src/job/entities/job.entity';
import { Application } from 'src/application/entities/application.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Index('user_account_status_idx')
  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.INACTIVE })
  accountStatus: AccountStatus;

  @Column({ nullable: true, type: 'bytea' })
  photo: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ default: false })
  isConfirmed: boolean;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @ManyToOne(() => UserRole, { eager: true, nullable: true })
  @JoinColumn({ name: 'userRoleId' })
  userRole: UserRole;

  @OneToMany(() => Job, job => job.business)
  jobs: Job[];

  @OneToMany(() => Application, application => application.student)
  applications: Application[];
}