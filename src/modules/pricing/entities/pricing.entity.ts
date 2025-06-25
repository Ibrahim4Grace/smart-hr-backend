import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';
import { AccessType, Duration, Region } from '../interface/price.interface';


@Entity('pricings')
export class Pricing extends AbstractBaseEntity {

  @Column({ type: 'text' })
  plan_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', default: Region.AFRICA })
  region: Region;

  @Column({ type: 'text', default: AccessType.HR_ONLY })
  access_type: AccessType;

  @Column({ type: 'int', default: 0, nullable: true })
  max_employees: number;

  @Column({ type: 'text' })
  features: string;

  @Column({ type: 'text' })
  currency: string;

  @Column({ type: 'text', default: Duration.MONTHLY })
  duration: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Subscription, (subscription) => subscription.pricing)
  subscriptions: Subscription[];

}
