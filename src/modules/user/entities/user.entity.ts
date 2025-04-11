import { Column, Entity, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { UserRole } from '../../auth/enum/usertype';

@Entity({ name: 'users' })
export class User extends AbstractBaseEntity {
  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  is_active: boolean;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Employee, (employee) => employee.user) // If employees are linked to users
  employees: Employee[]; // Only if users can have multiple employee profiles or if this is a 1:1 relationship
}
