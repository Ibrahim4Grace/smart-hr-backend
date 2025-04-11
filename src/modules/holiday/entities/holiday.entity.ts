import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';

@Entity('holidays')
export class Holiday extends AbstractBaseEntity {
  @Column({ type: 'date' })
  date: Date;

  @Column({ length: 200 })
  description: string;

  @Column({ type: 'boolean', default: false })
  isNational: boolean;
}
