import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Chat } from './chat.entity';

@Entity('chat_rooms')
export class ChatRoom extends AbstractBaseEntity {

    @Column({ nullable: false })
    name: string;

    @ManyToMany(() => User)
    @JoinTable({
        name: 'chat_room_participants',
        joinColumn: { name: 'chat_room_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    })
    participants: User[];

    @OneToMany(() => Chat, (chat: Chat) => chat.chatRoom)
    chats: Chat[];

} 