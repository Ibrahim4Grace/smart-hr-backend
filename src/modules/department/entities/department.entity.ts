import { Entity, Column, OneToMany, JoinColumn, Index, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '@modules/user/entities/user.entity';
import { Designation } from '@modules/designation/entities/designation.entity';

@Entity('departments')
export class Department extends AbstractBaseEntity {
    @Column({ type: 'text' })
    name: string;

    @OneToMany(() => Designation, (designation) => designation.department)
    designations: Designation[];

    //relationship to track which HR added this department
    @Index()
    @ManyToOne(() => User, (user) => user.departments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_by_hr_id' })
    added_by_hr: User;

}
