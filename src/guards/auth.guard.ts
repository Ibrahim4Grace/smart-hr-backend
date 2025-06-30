import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { IS_PUBLIC_KEY } from '@shared/helpers/skipAuth';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { TokenService } from '@shared/token/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tokenService: TokenService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublicRoute) {
      return true;
    }

    if (!token) throw new CustomHttpException(SYS_MSG.TOKEN_NOT_PROVIDED, HttpStatus.UNAUTHORIZED);


    try {
      const payload = await this.tokenService.verifyAuthToken(token);
      request['user'] = payload;
      request['token'] = token;
      return true;
    } catch (error) {
      throw new CustomHttpException(SYS_MSG.UNAUTHENTICATED_MESSAGE, HttpStatus.UNAUTHORIZED);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
