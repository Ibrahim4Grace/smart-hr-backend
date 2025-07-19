import { Entity, Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '@modules/user/entities/user.entity';
import { Department } from '@modules/department/entities/department.entity';

@Entity('designations')
export class Designation extends AbstractBaseEntity {
    @Column({ type: 'text' })
    name: string;

    @Index()
    @ManyToOne(() => Department, (department) => department.designations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'department_id' })
    department: Department;

    //relationship to track which HR added this designation
    @Index()
    @ManyToOne(() => User, (user) => user.designations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_by_hr_id' })
    added_by_hr: User;
}
