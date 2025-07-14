import { Entity, Column, OneToMany, JoinColumn, ManyToOne, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Invoice } from '../../invoice/entities/invoice.entity';
import { User } from '../../user/entities/user.entity';

@Entity('customers')
export class Customer extends AbstractBaseEntity {
    @Column({ type: 'text' })
    full_name: string;

    @Column({ type: 'text' })
    email: string;

    @Column({ type: 'text' })
    phone: string;

    @Column({ type: 'text' })
    company: string;

    @Column({ type: 'text' })
    address: string;

    @OneToMany(() => Invoice, invoice => invoice.customer)
    invoices: Invoice[];

    @Index()
    @ManyToOne(() => User, user => user.customers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
