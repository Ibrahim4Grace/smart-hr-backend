import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface SSEEvent {
    type: string;
    data: any;
    userId?: string;
    timestamp: Date;
}

export interface SSEConnection {
    userId: string;
    subject: Subject<SSEEvent>;
    lastActivity: Date;
}

@Injectable()
export class SSEService {
    private readonly logger = new Logger(SSEService.name);
    private connections: Map<string, SSEConnection> = new Map();
    private globalEvents = new Subject<SSEEvent>();

    /**
     * Create a new SSE connection for a user
     * @param userId - The user ID to create connection for
     * @returns Observable of SSE events for this user
     */
    createConnection(userId: string): Observable<SSEEvent> {
        // Remove existing connection if any
        this.removeConnection(userId);

        // Create new connection
        const subject = new Subject<SSEEvent>();
        const connection: SSEConnection = {
            userId,
            subject,
            lastActivity: new Date(),
        };

        this.connections.set(userId, connection);
        this.logger.log(`SSE connection created for user: ${userId}`);

        // Return observable that filters events for this user
        return subject.asObservable().pipe(
            filter(event => !event.userId || event.userId === userId),
            map(event => ({
                ...event,
                timestamp: event.timestamp || new Date(),
            }))
        );
    }

    /**
     * Remove a user's SSE connection
     * @param userId - The user ID to remove connection for
     */
    removeConnection(userId: string): void {
        const connection = this.connections.get(userId);
        if (connection) {
            connection.subject.complete();
            this.connections.delete(userId);
            this.logger.log(`SSE connection removed for user: ${userId}`);
        }
    }

    /**
     * Send an event to a specific user
     * @param userId - The user ID to send event to
     * @param type - Event type
     * @param data - Event data
     */
    sendToUser(userId: string, type: string, data: any): void {
        const connection = this.connections.get(userId);
        if (connection) {
            const event: SSEEvent = {
                type,
                data,
                userId,
                timestamp: new Date(),
            };
            connection.subject.next(event);
            connection.lastActivity = new Date();
            this.logger.debug(`SSE event sent to user ${userId}: ${type}`);
        } else {
            this.logger.warn(`No SSE connection found for user: ${userId}`);
        }
    }

    /**
     * Send an event to all connected users
     * @param type - Event type
     * @param data - Event data
     */
    sendToAll(type: string, data: any): void {
        const event: SSEEvent = {
            type,
            data,
            timestamp: new Date(),
        };

        this.connections.forEach((connection) => {
            connection.subject.next(event);
            connection.lastActivity = new Date();
        });

        this.globalEvents.next(event);
        this.logger.debug(`SSE event sent to all users: ${type}`);
    }

    /**
     * Send an event to multiple specific users
     * @param userIds - Array of user IDs to send event to
     * @param type - Event type
     * @param data - Event data
     */
    sendToUsers(userIds: string[], type: string, data: any): void {
        userIds.forEach(userId => this.sendToUser(userId, type, data));
    }

    /**
     * Get all active connections
     * @returns Array of user IDs with active connections
     */
    getActiveConnections(): string[] {
        return Array.from(this.connections.keys());
    }

    /**
     * Check if a user has an active connection
     * @param userId - The user ID to check
     * @returns True if user has active connection
     */
    hasConnection(userId: string): boolean {
        return this.connections.has(userId);
    }

    /**
     * Get connection count
     * @returns Number of active connections
     */
    getConnectionCount(): number {
        return this.connections.size;
    }

    /**
     * Clean up inactive connections (older than specified minutes)
     * @param inactiveMinutes - Minutes after which connection is considered inactive
     */
    cleanupInactiveConnections(inactiveMinutes: number = 30): void {
        const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);
        const inactiveUsers: string[] = [];

        this.connections.forEach((connection, userId) => {
            if (connection.lastActivity < cutoffTime) {
                inactiveUsers.push(userId);
            }
        });

        inactiveUsers.forEach(userId => this.removeConnection(userId));

        if (inactiveUsers.length > 0) {
            this.logger.log(`Cleaned up ${inactiveUsers.length} inactive SSE connections`);
        }
    }

    /**
     * Get global events observable (for broadcasting)
     * @returns Observable of global events
     */
    getGlobalEvents(): Observable<SSEEvent> {
        return this.globalEvents.asObservable();
    }
} 