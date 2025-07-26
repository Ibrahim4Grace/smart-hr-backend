import { Entity, Column, JoinColumn, Index, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '@modules/user/entities/user.entity';
import { Employee } from '@modules/employee/entities/employee.entity';

export enum DepartmentStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

@Entity('departments')
export class Department extends AbstractBaseEntity {
    @Column({ type: 'text' })
    name: string;

    @Column({ type: 'text', default: DepartmentStatus.ACTIVE })
    status: string;

    @OneToMany(() => Employee, (employee) => employee.department)
    employees: Employee[];

    //relationship to track which HR added this department
    @Index()
    @ManyToOne(() => User, (user) => user.departments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_by_hr_id' })
    added_by_hr: User;

}
