import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { User } from '../../user/entities/user.entity';

export enum NotePriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export enum NoteStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

@Entity('notes')
export class Note extends AbstractBaseEntity {
    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    assignee: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'simple-array' })
    tags: string[];

    @Column({ type: 'enum', enum: NotePriority, default: NotePriority.MEDIUM })
    priority: NotePriority;

    @Column({ type: 'enum', enum: NoteStatus, default: NoteStatus.ACTIVE })
    status: NoteStatus;

    @Column({ type: 'timestamp' })
    dueDate: Date;

    @Index()
    @ManyToOne(() => User, user => user.notes)
    @JoinColumn({ name: 'user_id' })
    user: User;

    // @Index()
    // @ManyToOne(() => User, { nullable: true })
    // @JoinColumn({ name: 'assignee_id' })
    // assignee: User;
}


