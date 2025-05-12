import { IdVerificationStatus } from 'common/enums/id-verification-status';
import { User } from 'src/auth/entities/user.entity';
import { BaseEntity } from 'src/base.enttity';
import { Job } from 'src/job/entities/job.entity';
import { Entity, Column, OneToMany } from 'typeorm';

@Entity('businesses')
export class Business extends BaseEntity {
  @Column()
  businessName: string;

  @Column({ unique: true })
  registrationNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: IdVerificationStatus,
    default: IdVerificationStatus.PENDING,
  })
  verificationStatus: IdVerificationStatus;

  @OneToMany(() => User, user => user.business)
  staff: User[];

  @OneToMany(() => Job, job => job.business)
  jobs: Job[];
}
