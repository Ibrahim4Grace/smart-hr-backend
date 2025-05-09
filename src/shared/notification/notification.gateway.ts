import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*', // In production, replace with your frontend URL
    },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(NotificationGateway.name);
    private connectedClients: Map<string, Socket> = new Map();

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.connectedClients.set(userId, client);
            this.logger.log(`Client connected: ${userId}`);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.connectedClients.delete(userId);
            this.logger.log(`Client disconnected: ${userId}`);
        }
    }

    // Method to send notification to specific user
    sendNotification(userId: string, notification: any) {
        const client = this.connectedClients.get(userId);
        if (client) {
            client.emit('notification', notification);
        }
    }

    // Method to send email notification
    sendEmailNotification(userId: string, emailData: any) {
        const client = this.connectedClients.get(userId);
        if (client) {
            client.emit('emailNotification', emailData);
        }
    }
} 