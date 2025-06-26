import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import { AbstractBaseEntity } from '../../../entities/base.entity';

@Entity('calendar_events')
export class Calendar extends AbstractBaseEntity {

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'timestamp' })
    eventDate: Date;

    @Column({ type: 'timestamp' })
    startTime: Date;

    @Column({ type: 'timestamp' })
    endTime: Date;

    @Column({ type: 'varchar', length: 100, nullable: true })
    location: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Index()
    @ManyToOne(() => User, user => user.calendars, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;


}
