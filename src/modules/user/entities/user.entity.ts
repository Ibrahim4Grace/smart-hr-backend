import { Column, Entity, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { UserRole } from '../enum/user.role';
import { Profile } from '../../profile/entities/profile.entity';

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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: true })
  status: boolean;

  @Column({ default: false })
  is_active: boolean;

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true, // Auto save/update/delete profile
    onDelete: 'CASCADE', // DB-level cascade
  })
  profile: Profile;

  @OneToMany(() => Subscription, (subscription) => subscription.user, {
    cascade: true,
  })
  subscriptions: Subscription[];

  @OneToMany(() => Employee, (employee) => employee.user, {
    cascade: true,
  })
  employees: Employee[]; // Only if users can have multiple employee profiles or if this is a 1:1 relationship
}
