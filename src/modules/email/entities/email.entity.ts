import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { AbstractBaseEntity } from '@entities/base.entity';

@Entity('email_accounts')
export class EmailAccount extends AbstractBaseEntity {


    @Column({ name: 'user_id' })
    userId: string;

    @Column({ nullable: true })
    email: string;

    @Column()
    from: string;

    @Column()
    to: string;

    @Column({ nullable: true })
    ownerEmail: string;

    @Column()
    subject: string;

    @Column('text')
    body: string;

    @Column({ default: 'inbox' })
    folder: string;

    @Column({ default: false })
    isRead: boolean;

    @Column('jsonb', { nullable: true })
    attachments: Array<{
        filename: string;
        size: number;
        mimetype: string;
        cloudinaryUrl?: string;
    }>;

    @Index()
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

}
