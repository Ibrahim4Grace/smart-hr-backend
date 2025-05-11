import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '../../user/entities/user.entity';

@Entity('invoices')
export class Invoice extends AbstractBaseEntity {
    @Column({ length: 255 })
    title: string;

    @Index()
    @ManyToOne(() => User, user => user.invoices)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
