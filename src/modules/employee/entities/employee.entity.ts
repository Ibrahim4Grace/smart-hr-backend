import { Entity, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Leave } from '../../leave/entities/leave.entity';
import { Project } from '../../project/entities/project.entity';
import { User } from '../../user/entities/user.entity';

@Entity('employees')
export class Employee extends AbstractBaseEntity {
  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salary: number;

  @Column({ type: 'date' })
  hireDate: Date;

  @OneToOne(() => User, (user) => user.employees)
  @JoinColumn()
  user: User;

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances: Attendance[];

  @OneToMany(() => Leave, (leave) => leave.employee)
  leaves: Leave[];

  @OneToMany(() => Project, (project) => project.manager) // Assuming manager is an employee
  managedProjects: Project[];
}
