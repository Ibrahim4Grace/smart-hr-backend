import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Pricing } from '../../pricing/entities/pricing.entity';

@Entity('subscriptions')
export class Subscription extends AbstractBaseEntity {
  @ManyToOne(() => User, (user) => user.subscriptions)
  user: User;

  @ManyToOne(() => Pricing, (pricing) => pricing.subscriptions)
  pricing: Pricing;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status: string; // e.g., Active, Canceled
}
