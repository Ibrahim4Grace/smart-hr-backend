import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Pricing } from '../../pricing/entities/pricing.entity';
import { SubscriptionStatus, PaymentStatus } from '../interface/subscription.interface';


@Entity('subscriptions')
export class Subscription extends AbstractBaseEntity {

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date;

  @Column({
    type: 'enum', enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum', enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount_paid: number;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ nullable: true })
  paystack_reference: string;

  @Column({ nullable: true })
  paystack_customer_code: string;

  @Column({ type: 'boolean', default: true })
  auto_renew: boolean;

  @Column({ type: 'boolean', default: false })
  is_trial: boolean;

  @Index()
  @ManyToOne(() => Pricing, (pricing) => pricing.subscriptions, { onDelete: 'CASCADE' })
  pricing: Pricing;

  @Index()
  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  user: User;
}




