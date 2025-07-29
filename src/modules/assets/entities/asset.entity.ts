import { Entity, Column, JoinColumn, Index, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '@modules/user/entities/user.entity';
import { Employee } from '@modules/employee/entities/employee.entity';

export enum AssetStatus {
    AVAILABLE = 'Available',
    MAINTENANCE = 'Maintenance',
    REPAIR = 'Repair',
    DISPOSED = 'Disposed',
    ASSIGNED = 'Assigned'

}

@Entity('assets')
export class Asset extends AbstractBaseEntity {

    @Column({ type: 'text', nullable: false })
    type: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    cost: number;

    @Column({ type: 'date', nullable: true })
    purchase_date: Date;

    @Column({ type: 'text', nullable: true })
    warranty_period: string;

    @Column({ type: 'text', nullable: true })
    serial_number: string;

    @Column({ type: 'text', nullable: true })
    purchase_from: string;

    @Column({ type: 'text', nullable: true })
    asset_image_url: string;

    @Column({ type: 'text', nullable: true })
    report_issue: string;

    @Column({
        type: 'enum',
        enum: AssetStatus,
        default: AssetStatus.AVAILABLE
    })
    status: AssetStatus;

    @ManyToOne(() => Employee, (employee) => employee.assets, { nullable: true })
    @JoinColumn({ name: 'assigned_to_employee_id' })
    assigned_to: Employee;

    @Column({ type: 'timestamp', nullable: true })
    assigned_at: Date;

    //relationship to track which HR added this assets
    @Index()
    @ManyToOne(() => User, (user) => user.assets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_by_hr_id' })
    added_by_hr: User;

}
