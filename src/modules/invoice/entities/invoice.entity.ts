import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Customer } from '../../customer/entities/customer.entity';


export enum InvoiceStatus {
    PENDING = 'pending',
    PAID = 'paid',
    CANCELLED = 'cancelled',
    OVERDUE = 'overdue',
    FAILED = 'failed',
}

@Entity('invoices')
export class Invoice extends AbstractBaseEntity {
    @Column({ type: 'text' })
    invoice_title: string;

    @Column({ type: 'text' })
    invoice_number: string;

    @Column({ type: 'date' })
    invoice_date: Date;

    @Column({ type: 'date' })
    due_date: Date;

    @Column({ type: 'text' })
    payment_type: string;

    @Column({ type: 'text' })
    bank_name: string;

    @Column({ type: 'json', nullable: true })
    items: {
        description: string;
        quantity: number;
        discount: number;
        rate: number;
    }[];

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.02 })
    overdue_interest: number;

    @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.05 })
    vat_percentage: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    sub_total: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_discount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    vat_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_amount: number;

    @Column({ type: 'text', nullable: true })
    amount_in_words: string;

    @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
    status: InvoiceStatus;

    @Index()
    @ManyToOne(() => Customer, customer => customer.invoices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @Index()
    @ManyToOne(() => User, user => user.invoices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

}