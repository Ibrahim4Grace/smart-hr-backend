import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '../../user/entities/user.entity';

export enum TodoPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum TodoStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'Inprogress',
  ON_HOLD = 'Onhold',
  COMPLETED = 'Completed'
}

export enum TodoTag {
  INTERNAL = 'Internal',
  PROJECTS = 'Projects',
  MEETINGS = 'Meetings',
  REMINDER = 'Reminder'
}

@Entity('todos')
export class Todo extends AbstractBaseEntity {
  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TodoTag,
    default: TodoTag.INTERNAL
  })
  tag: TodoTag;

  @Column({
    type: 'enum',
    enum: TodoPriority,
    default: TodoPriority.MEDIUM
  })
  priority: TodoPriority;

  @Column({
    type: 'enum',
    enum: TodoStatus,
    default: TodoStatus.PENDING
  })
  status: TodoStatus;

  @Column({ type: 'text' })
  assigned_to: string;

  @Index()
  @ManyToOne(() => User, user => user.todos)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
