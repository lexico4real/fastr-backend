import { Entity, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from 'src/base.enttity';

@Entity()
export class ReferralSource extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.referralSource)
  users: User[];
}
