import { Entity, Column, ManyToOne, ManyToMany, JoinTable, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Employee } from '../../employee/entities/employee.entity';

@Entity('projects')
export class Project extends AbstractBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Index()
  @ManyToOne(() => Employee, (employee) => employee.managedProjects, { onDelete: 'CASCADE' })
  manager: Employee;

  @ManyToMany(() => Employee)
  @JoinTable()
  employees: Employee[];
}
