import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from 'src/base.enttity';
import { UserPrivilege } from './user-privilege';

@Entity()
export class UserRole extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  comment: string;

  @ManyToMany(() => UserPrivilege, { cascade: true })
  @JoinTable()
  user_privileges: UserPrivilege[];

  @OneToMany(() => User, (user) => user.userRole)
  users: User[];
}