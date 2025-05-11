import { Entity, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Leave } from '../../leave/entities/leave.entity';
import { Project } from '../../project/entities/project.entity';
import { User } from '../../user/entities/user.entity';
import { UserRole } from '../../auth/interfaces/auth.interface';
import { Exclude } from 'class-transformer';

@Entity('employees')
export class Employee extends AbstractBaseEntity {
  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  get name(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  @Column({ nullable: false, unique: true })
  employee_id: string;

  @Column({ type: 'date' })
  joining_date: Date;

  @Column({ nullable: false, unique: true })
  email: string;

  @Exclude()
  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  phone_number: string;

  @Column({ nullable: false })
  company: string;

  @Column({ nullable: false })
  department: string;

  @Column({ nullable: false })
  designation: string;

  @Column({ nullable: true })
  employee_profile_pic_url: string;

  @Column({ default: UserRole.EMPLOYEE })
  role: string;

  @Column({ default: true })
  status: boolean;

  @Column({ nullable: true })
  deactivation_reason: string;

  @Column({ nullable: true })
  deactivated_by: string;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_at: Date;

  @Column({ nullable: true })
  reactivation_reason: string;

  @Column({ nullable: true })
  reactivated_by: string;

  @Column({ type: 'timestamp', nullable: true })
  reactivated_at: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances: Attendance[];

  @OneToMany(() => Leave, (leave) => leave.employee)
  leaves: Leave[];

  @OneToMany(() => Project, (project) => project.manager) // Assuming manager is an employee
  managedProjects: Project[];

  //relationship to track which HR added this employee
  @ManyToOne(() => User)
  @JoinColumn({ name: 'added_by_hr_id' })
  added_by_hr: User;
}
