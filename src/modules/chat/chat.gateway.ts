import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { NotificationGateway } from '../../shared/notification/notification.gateway';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private onlineUsers = new Map<string, string>();

    constructor(private notificationGateway: NotificationGateway) { }

    handleConnection(client: Socket) {
        const userId = client.handshake.auth.userId;
        this.onlineUsers.set(userId, client.id);
        this.notificationGateway.sendNotification(userId, {
            type: 'USER_ONLINE',
            data: { userId }
        });
    }

    handleDisconnect(client: Socket) {
        const userId = client.handshake.auth.userId;
        this.onlineUsers.delete(userId);
        this.notificationGateway.sendNotification(userId, {
            type: 'USER_OFFLINE',
            data: { userId }
        });
    }

    @SubscribeMessage('typing')
    handleTyping(client: Socket, payload: { chatRoomId: string; isTyping: boolean }) {
        const userId = client.handshake.auth.userId;
        this.notificationGateway.sendNotification(userId, {
            type: 'USER_TYPING',
            data: {
                userId,
                chatRoomId: payload.chatRoomId,
                isTyping: payload.isTyping
            }
        });
    }

    isUserOnline(userId: string): boolean {
        return this.onlineUsers.has(userId);
    }
} 