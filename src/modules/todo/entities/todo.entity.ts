import { Entity, Column, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { Project } from '../../project/entities/project.entity';

@Entity('todos')
export class Todo extends AbstractBaseEntity {
  @Column({ length: 500 })
  description: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ length: 50, default: 'Pending' })
  status: string; // e.g., Pending, In Progress, Completed

  @ManyToOne(() => Employee, (employee) => employee.attendances)
  assignedTo: Employee;

  @ManyToOne(() => Project, (project) => project.employees)
  project: Project;
}
