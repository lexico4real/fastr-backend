import { BaseEntity } from 'src/base.enttity';
import { Column, Entity } from 'typeorm';

@Entity()
export class UserPrivilege extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  comment: string;
}