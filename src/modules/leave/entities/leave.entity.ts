import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Employee } from '../../employee/entities/employee.entity';

@Entity('leaves')
export class Leave extends AbstractBaseEntity {


  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ length: 50 })
  type: string; // e.g., Sick, Vacation, Personal

  @Column({ length: 500 })
  reason: string;

  @Column({ length: 50, default: 'Pending' })
  status: string; // e.g., Pending, Approved, Rejected

  @Index()
  @ManyToOne(() => Employee, (employee) => employee.leaves, { onDelete: 'CASCADE' })
  employee: Employee;
}
