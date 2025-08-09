import { Entity, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Client } from '../../client/entities/client.entity';
import { Employee } from '../../employee/entities/employee.entity';

export enum ProjectPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum ProjectStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
  CANCELLED = 'Cancelled',
}

@Entity('projects')
export class Project extends AbstractBaseEntity {
  @Column({ nullable: false, unique: true })
  project_id: string;

  @Column({ length: 100 })
  name: string;


  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({
    type: 'enum',
    enum: ProjectPriority,
    nullable: true,
  })
  priority: ProjectPriority;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  project_value: number;


  @Column({ type: 'text', nullable: true })
  project_image_url: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;


  // Client (required for most projects)
  @Index()
  @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ nullable: true })
  client_id: string;

  // Team Members - Only employees can be team members
  @ManyToMany(() => Employee, { cascade: true })
  @JoinTable({
    name: 'project_team_members',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'employee_id', referencedColumnName: 'id' },
  })
  team_members: Employee[];

  // Team Leaders - Only employees can be team leaders
  @ManyToMany(() => Employee, { cascade: true })
  @JoinTable({
    name: 'project_team_leaders',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'employee_id', referencedColumnName: 'id' },
  })
  team_leaders: Employee[];

  // Track which HR added this project
  @Index()
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'added_by_hr_id' })
  added_by_hr: User;

}
