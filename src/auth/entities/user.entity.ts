import { AccountStatus } from 'common/enums/account-status';
import { BaseEntity } from 'src/base.enttity';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserRole } from './user-role.entity';
import { Job } from 'src/job/entities/job.entity';
import { Application } from 'src/application/entities/application.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import { Business } from 'src/business/entities/business.entity';
import { Rating } from 'src/rating/entities/rating.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Index('user_account_status_idx')
  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.INACTIVE,
  })
  accountStatus: AccountStatus;

  @Column({ default: false })
  isEmailVerified: boolean;

  @ManyToOne(() => UserRole, { eager: true, nullable: true })
  @JoinColumn({ name: 'userRoleId' })
  userRole: UserRole;

  @OneToMany(() => Application, (application) => application.student)
  applications: Application[];

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true,
    eager: true,
  })
  profile: Profile;

  @ManyToOne(() => Business, (business) => business.staff, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @OneToMany(() => Rating, (rating) => rating.rater)
  ratingsGiven: Rating[];

  @OneToMany(() => Rating, (rating) => rating.ratee)
  ratingsReceived: Rating[];
}
