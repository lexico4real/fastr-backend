import { IdVerificationStatus } from 'common/enums/id-verification-status';
import { ProfileType } from 'common/enums/profile-type';
import { User } from 'src/auth/entities/user.entity';
import { BaseEntity } from 'src/base.enttity';
import { Business } from 'src/business/entities/business.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToMany, ManyToOne } from 'typeorm';

@Entity('profiles')
export class Profile extends BaseEntity {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: 'NA' })
  otherName: string;

  @Column({ nullable: true, unique: true })
  phoneNumber: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  resumeUrl: string;

  @Column({ type: 'json', nullable: true, default: [] })
  skills: string[];

  @Column({ nullable: true })
  education: string;

  @Column({ default: false })
  isWorkPermitVerified: boolean;

  @Column({ nullable: true })
  availability: string;

  @Column({ nullable: true })
  profilePhotoUrl: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: true })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: IdVerificationStatus,
    default: IdVerificationStatus.PENDING,
  })
  verificationStatus: IdVerificationStatus;

  @Column({
    type: 'enum',
    enum: ProfileType,
    default: ProfileType.INDIVIDUAL,
  })
  profileType: ProfileType;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Business, (business) => business.profiles, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ nullable: true })
  businessId: string;
}
