import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { AuthJwtPayload, EmailVerificationPayload, RefreshTokenPayload } from './interface/token.interface';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  // Authentication token methods
  createAuthToken(payload: { userId: string; role: string }): string {
    const secret = this.configService.get<string>('JWT_AUTH_SECRET');
    if (!secret) throw new Error('JWT_AUTH_SECRET is not defined');

    // const expiresIn = this.configService.get<string>('JWT_AUTH_EXPIRES_IN', '15m');
    const expiresIn = this.configService.get<string>('JWT_AUTH_EXPIRES_IN');
    return this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });
  }

  async verifyAuthToken(token: string): Promise<AuthJwtPayload> {
    try {
      const secret = this.configService.get<string>('JWT_AUTH_SECRET');
      if (!secret) throw new Error('JWT_AUTH_SECRET is not defined');
      return this.jwtService.verify<AuthJwtPayload>(token, { secret });
    } catch (error) {
      this.handleTokenError(error, 'Authentication token');
    }

  }

  // Refresh token methods
  createRefreshToken(payload: { userId: string; role: string }): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');

    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');
    return this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
      return this.jwtService.verify<RefreshTokenPayload>(token, { secret });
    } catch (error) {
      this.handleTokenError(error, 'Refresh token');
    }
  }

  // Email verification token methods
  createEmailVerificationToken(payload: { userId: string; role: string }): string {
    const secret = this.configService.get<string>('JWT_EMAIL_SECRET');
    if (!secret) throw new Error('JWT_EMAIL_SECRET is not defined');

    const expiresIn = this.configService.get<string>('JWT_EMAIL_EXPIRES_IN');
    return this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });
  }

  async verifyEmailToken(token: string): Promise<EmailVerificationPayload> {
    try {
      const secret = this.configService.get<string>('JWT_EMAIL_SECRET');
      if (!secret) throw new Error('JWT_EMAIL_SECRET is not defined');
      return this.jwtService.verify<EmailVerificationPayload>(token, { secret });
    } catch (error) {
      this.handleTokenError(error, 'Email verification token');
    }
  }


  private handleTokenError(error: any, tokenType: string): never {
    this.logger.warn(`${tokenType} verification failed: ${error.message}`);

    if (error instanceof TokenExpiredError) {
      throw new UnauthorizedException(`${tokenType} has expired`);
    }

    if (error instanceof JsonWebTokenError) {
      throw new UnauthorizedException(`Invalid ${tokenType.toLowerCase()}`);
    }

    if (error instanceof NotBeforeError) {
      throw new UnauthorizedException(`${tokenType} not active yet`);
    }

    // For any other JWT-related errors
    throw new UnauthorizedException(`${tokenType} verification failed`);
  }
}
