import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import { Employee } from '@modules/employee/entities/employee.entity';
import { AbstractBaseEntity } from '../../../entities/base.entity';

@Entity()
export class Otp extends AbstractBaseEntity {
  @Column()
  otp: string;

  @Column()
  expiry: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Index()
  @Column({ nullable: true })
  employee_id: string;

  @Column({ default: false })
  verified: boolean;
} 