import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PaymentStatus } from 'common/enums/payment-status';
import { User } from 'src/auth/entities/user.entity';
import { BaseEntity } from 'src/base.enttity';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column()
  businessId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'businessId' })
  business: User;

  @Column()
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  jobId: string;

  @Column({ nullable: true })
  paidAt: Date;
}
