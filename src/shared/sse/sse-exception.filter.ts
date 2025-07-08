import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class SSEExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(SSEExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        // Only handle SSE endpoints
        if (!request.url.includes('/sse/connect')) {
            return;
        }

        // Check if response has already been sent
        if (response.headersSent) {
            this.logger.warn('Response already sent, cannot handle exception');
            return;
        }

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : {
                    message:
                        (exception as InternalServerErrorException).message ||
                        'Internal server error',
                    error: 'Internal Server Error',
                };

        const errorMessage =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message;

        const error =
            typeof exceptionResponse === 'string'
                ? ''
                : (exceptionResponse as any).error;

        this.logger.error(`SSE Exception: ${errorMessage}`, exception);

        // For SSE endpoints, we want to send a proper error response
        // but not interfere with the SSE stream
        response.status(status).json({
            status_code: status,
            error: error,
            message: errorMessage,
        });
    }
} 