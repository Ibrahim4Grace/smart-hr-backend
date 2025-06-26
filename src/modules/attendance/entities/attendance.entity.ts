import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Employee } from '../../employee/entities/employee.entity';

@Entity('attendances')
export class Attendance extends AbstractBaseEntity {


  @Column({ nullable: true })
  date: Date;

  @Column({ type: 'time' })
  checkInTime: string;

  @Column({ type: 'time', nullable: true })
  checkOutTime: string;

  @Column({ length: 50 })
  status: string; // e.g., Present, Absent, Late

  @Index()
  @ManyToOne(() => Employee, (employee) => employee.attendances, { onDelete: 'CASCADE' })
  employee: Employee;
}
