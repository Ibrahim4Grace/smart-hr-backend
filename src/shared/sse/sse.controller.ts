
import { Response } from 'express';
import { SSEService, SSEEvent } from './sse.service';
import { AuthGuard } from '@guards/auth.guard';
import { GetUser } from '@shared/decorators/user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
    Controller,
    Get,
    Res,
    Param,
    UseGuards,
    HttpStatus,
    Logger,
    OnModuleDestroy,
    OnModuleInit
} from '@nestjs/common';

@ApiTags('SSE')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('sse')
export class SSEController implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SSEController.name);
    private cleanupInterval: any;

    constructor(private readonly sseService: SSEService) { }

    onModuleInit() {
        // Set up periodic cleanup of inactive connections (every 5 minutes)
        this.cleanupInterval = setInterval(() => {
            this.sseService.cleanupInactiveConnections(30); // 30 minutes inactive
        }, 5 * 60 * 1000);
    }

    onModuleDestroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }

    @Get('connect')
    @ApiOperation({ summary: 'Establish SSE connection for real-time updates' })
    @ApiResponse({ status: 200, description: 'SSE connection established' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async connect(
        @GetUser('userId') userId: string,
        @Res() res: Response
    ) {
        try {
            // Set SSE headers
            res.writeHead(HttpStatus.OK, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control',
            });

            // Send initial connection event
            this.sendSSEMessage(res, {
                type: 'connection_established',
                data: { userId, message: 'SSE connection established' },
                timestamp: new Date(),
            });

            // Create SSE connection
            const eventStream = this.sseService.createConnection(userId);

            // Subscribe to events
            const subscription = eventStream.subscribe({
                next: (event: SSEEvent) => {
                    this.sendSSEMessage(res, event);
                },
                error: (error) => {
                    this.logger.error(`SSE error for user ${userId}:`, error);
                    this.sendSSEMessage(res, {
                        type: 'error',
                        data: { message: 'Connection error occurred' },
                        timestamp: new Date(),
                    });
                },
                complete: () => {
                    this.logger.log(`SSE connection completed for user ${userId}`);
                },
            });

            // Send heartbeat every 30 seconds to keep connection alive
            const heartbeatInterval = setInterval(() => {
                this.sendSSEMessage(res, {
                    type: 'heartbeat',
                    data: { timestamp: new Date().toISOString() },
                    timestamp: new Date(),
                });
            }, 30000);

            // Handle client disconnect
            res.on('close', () => {
                this.logger.log(`SSE connection closed for user ${userId}`);
                subscription.unsubscribe();
                clearInterval(heartbeatInterval);
                this.sseService.removeConnection(userId);
            });

            res.on('error', (error) => {
                this.logger.error(`SSE response error for user ${userId}:`, error);
                subscription.unsubscribe();
                clearInterval(heartbeatInterval);
                this.sseService.removeConnection(userId);
            });

        } catch (error) {
            this.logger.error(`Error establishing SSE connection for user ${userId}:`, error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to establish SSE connection',
            });
        }
    }

    @Get('status')
    @ApiOperation({ summary: 'Get SSE connection status' })
    @ApiResponse({ status: 200, description: 'Connection status returned' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getStatus(@GetUser('userId') userId: string) {
        const hasConnection = this.sseService.hasConnection(userId);
        const totalConnections = this.sseService.getConnectionCount();

        return {
            status_code: 200,
            data: {
                userId,
                hasConnection,
                totalConnections,
                timestamp: new Date(),
            },
        };
    }

    @Get('connections')
    @ApiOperation({ summary: 'Get all active SSE connections (Admin only)' })
    @ApiResponse({ status: 200, description: 'Active connections returned' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getConnections() {
        const activeConnections = this.sseService.getActiveConnections();
        const totalConnections = this.sseService.getConnectionCount();

        return {
            status_code: 200,
            data: {
                activeConnections,
                totalConnections,
                timestamp: new Date(),
            },
        };
    }

    private sendSSEMessage(res: Response, event: SSEEvent) {
        const message = `data: ${JSON.stringify(event)}\n\n`;
        res.write(message);
    }
} 