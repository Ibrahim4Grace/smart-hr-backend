import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RESPONSE_HANDLED_KEY } from '../decorators/response-handled.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Check if this is a route that handles its own response
    // If this route handles its own response, just pass through without modifying
    const isResponseHandled = this.reflector.get<boolean>(RESPONSE_HANDLED_KEY, context.getHandler());
    if (isResponseHandled) {
      return next.handle();
    }

    return next.handle().pipe(
      map((res: any) => this.responseHandler(res, context)),
      catchError((err: unknown) => throwError(() => this.errorHandler(err, context))),
    );
  }

  errorHandler(exception: unknown, context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (exception instanceof HttpException) return exception;
    this.logger.error(
      `Error processing request for ${req.method} ${req.url}, Message: ${exception['message']}, Stack: ${exception['stack']}`,
    );
    return new InternalServerErrorException({
      status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }

  responseHandler(res: any, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const status_code = response.statusCode;

    response.setHeader('Content-Type', 'application/json');
    if (typeof res === 'object') {
      const { message, ...data } = res;
      console.log('response', res);

      return {
        status_code,
        message,
        ...data,
      };
    } else {
      return res;
    }
  }
}
