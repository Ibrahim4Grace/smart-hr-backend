import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';

@Entity('pricings')
export class Pricing extends AbstractBaseEntity {
  @Column({ length: 50 })
  planName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @OneToMany(() => Subscription, (subscription) => subscription.pricing)
  subscriptions: Subscription[];

  @Column({ type: 'text' })
  features: string;

  @Column({ length: 20 })
  duration: string; // e.g., Monthly, Yearly
}
