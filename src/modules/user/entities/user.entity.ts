import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';
import { UserRole } from '@modules/auth/interfaces/auth.interface';
import { Todo } from '@modules/todo/entities/todo.entity';
import { Calendar } from '@modules/calendar/entities/calendar.entity';
import { Exclude } from 'class-transformer';
import { Note } from '@modules/notes/entities/note.entity';
import { Invoice } from '@modules/invoice/entities/invoice.entity';

@Entity({ name: 'users' })
export class User extends AbstractBaseEntity {

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Exclude()
  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  company: string;

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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.HR })
  role: UserRole;

  @Column({ nullable: true })
  hr_profile_pic_url: string;

  @Column({ nullable: true })
  admin_profile_pic_url: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: true })
  status: boolean;

  @Column({ default: false })
  is_active: boolean;

  @OneToMany(() => Todo, (todo) => todo.user, {
    cascade: true,
  })
  todos: Todo[];

  @OneToMany(() => Calendar, (calendar) => calendar.user)
  calendars: Calendar[];

  @OneToMany(() => Note, (note) => note.user)
  notes: Note[];

  @OneToMany(() => Invoice, (invoice) => invoice.user)
  invoices: Invoice[];

  @OneToMany(() => Subscription, (subscription) => subscription.user, {
    cascade: true,
  })
  subscriptions: Subscription[];

}
