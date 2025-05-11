import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChatRoom } from './chat-room.entity';
import { AbstractBaseEntity } from '../../../entities/base.entity';

@Entity('chats')
export class Chat extends AbstractBaseEntity {

    @Column({ nullable: false })
    message: string;

    @Column({ nullable: true })
    fileUrl: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.chats, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chat_room_id' })
    chatRoom: ChatRoom;
}
