import { HttpStatus, Injectable } from '@nestjs/common';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { UserService } from '@modules/user/user.service';
import { OtpService } from '@modules/otp/otp.service';
import { EmailService } from '@modules/email/email.service';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { CreateUserResponse } from './interfaces/auth.interface';
import { DataSource, EntityManager } from 'typeorm';
import { TokenService } from '../token/token.service';
import { PasswordService } from './password.service';
import { timestamp } from '@utils/time';
import * as bcrypt from 'bcryptjs';
import { Logger } from '@nestjs/common';
import { AuthHelperService } from './auth-helper.service';
import { CreateAuthDto, ForgotPasswordDto, UpdatePasswordDto, LoginResponseDto, LoginDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
    private readonly tokenService: TokenService,
    private passwordService: PasswordService,
    private readonly authHelperService: AuthHelperService,
  ) {}

  async create(createUserDto: CreateAuthDto): Promise<CreateUserResponse> {
    const result = await this.dataSource.transaction(async (manager: EntityManager) => {
      const userExists = await this.userService.getUserRecord({
        identifier: createUserDto.email,
        identifierType: 'email',
      });
      if (userExists) throw new CustomHttpException(SYS_MSG.USER_ACCOUNT_EXIST, HttpStatus.BAD_REQUEST);

      const user = await this.userService.create(createUserDto, manager);
      if (!user) throw new CustomHttpException(SYS_MSG.FAILED_TO_CREATE_USER, HttpStatus.BAD_REQUEST);

      const otpResult = await this.otpService.create(user.id, manager);
      if (!otpResult) throw new CustomHttpException(SYS_MSG.FAILED, HttpStatus.INTERNAL_SERVER_ERROR);

      const preliminaryToken = this.tokenService.createEmailVerificationToken({
        userId: user.id,
        role: user.role,
      });

      const responsePayload = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: preliminaryToken,
      };
      return {
        message: SYS_MSG.VERIFY_OTP_SENT,
        data: responsePayload,
        otp: otpResult.plainOtp,
      };
    });

    try {
      await this.emailService.sendUserEmailConfirmationOtp(result.data.user.email, result.data.user.name, result.otp);
      this.logger.log(`Successfully sent OTP email to ${result.data.user.email} with OTP: ${result.otp}`);
    } catch (emailError) {
      this.logger.error('Error sending confirmation email:', emailError);
    }

    return {
      message: result.message,
      data: result.data,
    };
  }

  async verifyToken(authorization: string, verifyOtp: { otp: string }) {
    const user = await this.authHelperService.validateBearerToken(authorization);

    const isValidOtp = await this.otpService.verify(user.id, verifyOtp.otp);
    if (!isValidOtp) throw new CustomHttpException(SYS_MSG.INVALID_OTP, HttpStatus.UNAUTHORIZED);

    await this.userService.update(user.id, { emailVerified: true, is_active: true });
    await this.otpService.remove(user.id);

    const responsePayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    await this.emailService.sendUserConfirmationMail(user.email, user.name, timestamp);
    this.logger.log(`Successfully sent welcome email to ${user.email}`);

    return {
      message: SYS_MSG.EMAIL_VERIFIED_SUCCESSFULLY,
      data: responsePayload,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; token: string }> {
    const user = await this.userService.getUserRecord({ identifier: dto.email, identifierType: 'email' });
    if (!user) {
      throw new CustomHttpException(SYS_MSG.USER_ACCOUNT_DOES_NOT_EXIST, HttpStatus.BAD_REQUEST);
    }

    await this.otpService.remove(user.id);

    const otpResult = await this.otpService.create(user.id);
    if (!otpResult) throw new CustomHttpException('Failed to generate OTP', HttpStatus.INTERNAL_SERVER_ERROR);

    const preliminaryToken = this.tokenService.createEmailVerificationToken({
      userId: user.id,
      role: user.role,
    });

    await this.emailService.sendForgotPasswordMail(user.email, user.name, otpResult.plainOtp);
    this.logger.log(`Successfully sent forgot password OTP to ${user.email} with OTP: ${otpResult.plainOtp}`);
    return {
      message: SYS_MSG.EMAIL_SENT,
      token: preliminaryToken,
    };
  }

  async verifyForgetPasswordOtp(authorization: string, verifyOtp: { otp: string }) {
    const user = await this.authHelperService.validateBearerToken(authorization);

    const isValidOtp = await this.otpService.verify(user.id, verifyOtp.otp);
    if (!isValidOtp) throw new CustomHttpException(SYS_MSG.INVALID_OTP, HttpStatus.UNAUTHORIZED);

    const responsePayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return {
      message: SYS_MSG.OTP_VERIFIED_SUCCESSFULLY,
      data: responsePayload,
    };
  }

  async updateForgotPassword(authorization: string, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.authHelperService.validateBearerToken(authorization);

    const otpVerified = await this.otpService.isOtpVerified(user.id);
    if (!otpVerified) {
      throw new CustomHttpException(SYS_MSG.OTP_VERIFIED, HttpStatus.UNAUTHORIZED);
    }

    const { new_password } = updatePasswordDto;
    const isSamePassword = await this.passwordService.comparePassword(new_password, user.password);
    if (isSamePassword) throw new CustomHttpException(SYS_MSG.DUPLICATE_PASSWORD, HttpStatus.BAD_REQUEST);

    await this.userService.updateUserRecord({
      updatePayload: {
        password: await this.passwordService.hashPassword(new_password),
      },
      identifierOptions: {
        identifierType: 'id',
        identifier: user.id,
      },
    });

    await this.otpService.remove(user.id);

    await this.emailService.sendPasswordChangedMail(user.email, user.name, timestamp);
    this.logger.log(`Successfully sent password changed confirmation to ${user.email}`);

    return {
      message: SYS_MSG.PASSWORD_UPDATED,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;
    const user = await this.userService.getUserRecord({
      identifier: email,
      identifierType: 'email',
    });

    if (!user) throw new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);

    if (!user.status || !user.is_active) {
      throw new CustomHttpException(SYS_MSG.ACCOUNT_INACTIVE, HttpStatus.FORBIDDEN);
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role,
    };

    const access_token = this.tokenService.createAuthToken(tokenPayload);
    const refresh_token = this.tokenService.createRefreshToken(tokenPayload);

    const responsePayload = {
      access_token,
      refresh_token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };

    return { message: SYS_MSG.LOGIN_SUCCESSFUL, ...responsePayload };
  }

  async refreshToken(refresh_token: string): Promise<{ access_token: string }> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refresh_token);
      const access_token = this.tokenService.createAuthToken({
        userId: payload.userId,
        role: payload.role,
      });

      return { access_token };
    } catch (error) {
      throw new CustomHttpException(SYS_MSG.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED);
    }
  }
}
