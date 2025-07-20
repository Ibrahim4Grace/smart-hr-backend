import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { AbstractBaseEntity } from '../../../entities/base.entity';

@Entity('calendar_events')
export class Calendar extends AbstractBaseEntity {

    @Column({ type: 'text' })
    title: string;

    @Column({ type: 'date' })
    event_date: Date;

    @Column({ type: 'timestamp' })
    start_time: Date;

    @Column({ type: 'timestamp' })
    end_time: Date;

    @Column({ type: 'text' })
    location: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Index()
    @ManyToOne(() => User, user => user.calendars, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;


}
