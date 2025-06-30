import { Injectable, Logger } from '@nestjs/common';
import { SSEService } from './sse.service';

export interface NotificationData {
    title?: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    data?: any;
    timestamp?: Date;
}

@Injectable()
export class SSENotificationService {
    private readonly logger = new Logger(SSENotificationService.name);

    constructor(private readonly sseService: SSEService) { }

    /**
     * Send a general notification to a user
     */
    sendNotification(userId: string, notification: NotificationData): void {
        this.sseService.sendToUser(userId, 'notification', {
            ...notification,
            timestamp: notification.timestamp || new Date(),
        });
        this.logger.debug(`Notification sent to user ${userId}: ${notification.message}`);
    }

    /**
     * Send calendar-related notifications
     */
    sendCalendarNotification(userId: string, event: any, action: 'created' | 'updated' | 'deleted' | 'reminder'): void {
        const messages = {
            created: 'New calendar event created',
            updated: 'Calendar event updated',
            deleted: 'Calendar event deleted',
            reminder: 'Calendar event reminder',
        };

        this.sseService.sendToUser(userId, `calendar_event_${action}`, {
            event,
            message: messages[action],
            type: action === 'deleted' ? 'warning' : 'info',
            timestamp: new Date(),
        });
    }

    /**
     * Send employee-related notifications
     */
    sendEmployeeNotification(userId: string, employee: any, action: 'created' | 'updated' | 'deleted' | 'status_changed'): void {
        const messages = {
            created: 'New employee added',
            updated: 'Employee information updated',
            deleted: 'Employee removed',
            status_changed: 'Employee status changed',
        };

        this.sseService.sendToUser(userId, `employee_${action}`, {
            employee,
            message: messages[action],
            type: action === 'deleted' ? 'warning' : 'info',
            timestamp: new Date(),
        });
    }

    /**
     * Send leave request notifications
     */
    sendLeaveNotification(userId: string, leaveRequest: any, action: 'submitted' | 'approved' | 'rejected' | 'cancelled'): void {
        const messages = {
            submitted: 'Leave request submitted',
            approved: 'Leave request approved',
            rejected: 'Leave request rejected',
            cancelled: 'Leave request cancelled',
        };

        this.sseService.sendToUser(userId, `leave_request_${action}`, {
            leaveRequest,
            message: messages[action],
            type: action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'info',
            timestamp: new Date(),
        });
    }

    /**
     * Send chat notifications
     */
    sendChatNotification(userId: string, chatData: any, action: 'new_message' | 'typing' | 'user_online' | 'user_offline'): void {
        const messages = {
            new_message: 'New message received',
            typing: 'User is typing',
            user_online: 'User is online',
            user_offline: 'User is offline',
        };

        this.sseService.sendToUser(userId, `chat_${action}`, {
            chatData,
            message: messages[action],
            type: 'info',
            timestamp: new Date(),
        });
    }

    /**
     * Send system notifications
     */
    sendSystemNotification(userId: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', data?: any): void {
        this.sseService.sendToUser(userId, 'system_notification', {
            message,
            type,
            data,
            timestamp: new Date(),
        });
    }

    /**
     * Send bulk notifications to multiple users
     */
    sendBulkNotification(userIds: string[], notification: NotificationData): void {
        this.sseService.sendToUsers(userIds, 'bulk_notification', {
            ...notification,
            timestamp: notification.timestamp || new Date(),
        });
        this.logger.debug(`Bulk notification sent to ${userIds.length} users: ${notification.message}`);
    }

    /**
     * Send broadcast notification to all connected users
     */
    sendBroadcastNotification(notification: NotificationData): void {
        this.sseService.sendToAll('broadcast_notification', {
            ...notification,
            timestamp: notification.timestamp || new Date(),
        });
        this.logger.debug(`Broadcast notification sent: ${notification.message}`);
    }

    /**
     * Send real-time data updates
     */
    sendDataUpdate(userId: string, dataType: string, data: any, action: 'created' | 'updated' | 'deleted'): void {
        this.sseService.sendToUser(userId, `${dataType}_${action}`, {
            data,
            action,
            timestamp: new Date(),
        });
    }

    /**
     * Send dashboard updates
     */
    sendDashboardUpdate(userId: string, dashboardData: any): void {
        this.sseService.sendToUser(userId, 'dashboard_update', {
            data: dashboardData,
            timestamp: new Date(),
        });
    }

    /**
     * Send alert notifications
     */
    sendAlert(userId: string, alert: { title: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }): void {
        this.sseService.sendToUser(userId, 'alert', {
            ...alert,
            timestamp: new Date(),
        });
    }

    /**
     * Send task/todo notifications
     */
    sendTaskNotification(userId: string, task: any, action: 'created' | 'updated' | 'completed' | 'assigned'): void {
        const messages = {
            created: 'New task created',
            updated: 'Task updated',
            completed: 'Task completed',
            assigned: 'Task assigned to you',
        };

        this.sseService.sendToUser(userId, `task_${action}`, {
            task,
            message: messages[action],
            type: action === 'completed' ? 'success' : 'info',
            timestamp: new Date(),
        });
    }

    /**
     * Send project notifications
     */
    sendProjectNotification(userId: string, project: any, action: 'created' | 'updated' | 'completed' | 'milestone_reached'): void {
        const messages = {
            created: 'New project created',
            updated: 'Project updated',
            completed: 'Project completed',
            milestone_reached: 'Project milestone reached',
        };

        this.sseService.sendToUser(userId, `project_${action}`, {
            project,
            message: messages[action],
            type: action === 'completed' ? 'success' : 'info',
            timestamp: new Date(),
        });
    }
} 