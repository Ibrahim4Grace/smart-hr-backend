import { Injectable, Logger } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(private readonly notificationGateway: NotificationGateway) { }

    // Send email notification
    async sendEmailNotification(userId: string, emailData: any) {
        try {
            this.notificationGateway.sendEmailNotification(userId, {
                type: 'email',
                data: emailData,
                timestamp: new Date(),
            });
            this.logger.debug(`Email notification sent to user ${userId}`);
        } catch (error) {
            this.logger.error(`Error sending email notification: ${error.message}`);
        }
    }

    // Generic notification method
    async sendNotification(userId: string, notification: any) {
        try {
            this.notificationGateway.sendNotification(userId, {
                ...notification,
                timestamp: new Date(),
            });
            this.logger.debug(`Notification sent to user ${userId}`);
        } catch (error) {
            this.logger.error(`Error sending notification: ${error.message}`);
        }
    }
} 