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

  @Index()
  @Column({ nullable: true })
  user_id: string;

  @Index()
  @Column({ nullable: true })
  employee_id: string;

  @Column({ default: false })
  verified: boolean;

  @Index()
  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Index()
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
} 