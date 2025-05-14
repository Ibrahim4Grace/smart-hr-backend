import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { PasswordService } from './password.service';
import { TokenService } from '@shared/token/token.service';
import { OtpService } from '@shared/otp/otp.service';
import { EmailQueueService } from '../email-queue/email-queue.service';
import { ForgotPasswordDto, UpdatePasswordDto } from './dto/create-auth.dto';
import { AuthHelperService } from './auth-helper.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class EmployeeAuthService {
    private readonly logger = new Logger(EmployeeAuthService.name);
    constructor(
        @InjectRepository(Employee)
        private employeeRepository: Repository<Employee>,
        private passwordService: PasswordService,
        private tokenService: TokenService,
        private otpService: OtpService,
        private emailQueueService: EmailQueueService,
        private authHelperService: AuthHelperService,
    ) { }

    async login(email: string, password: string) {
        const employee = await this.employeeRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'first_name', 'last_name', 'role', 'status']
        });

        if (!employee) throw new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);

        if (!employee.status) throw new CustomHttpException(SYS_MSG.ACCOUNT_DEACTIVATED, HttpStatus.FORBIDDEN);

        const isMatch = await this.passwordService.comparePassword(password, employee.password);
        if (!isMatch) throw new CustomHttpException(SYS_MSG.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);

        const tokenPayload = {
            userId: employee.id,
            role: employee.role,
        };

        const access_token = this.tokenService.createAuthToken(tokenPayload);
        const refresh_token = this.tokenService.createRefreshToken(tokenPayload);

        return {
            message: SYS_MSG.LOGIN_SUCCESSFUL,
            access_token,
            refresh_token,
            data: {
                employee: {
                    id: employee.id,
                    name: employee.name,
                    email: employee.email,
                    role: employee.role,
                },
            },
        };
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const employee = await this.employeeRepository.findOne({
            where: { email: dto.email },
            select: ['id', 'email', 'first_name', 'last_name']
        });

        if (!employee) throw new CustomHttpException(SYS_MSG.USER_ACCOUNT_DOES_NOT_EXIST, HttpStatus.BAD_REQUEST);

        await this.otpService.remove(employee.id, true);

        const otpResult = await this.otpService.create(employee.id, undefined, true);
        if (!otpResult) throw new CustomHttpException(SYS_MSG.FAILED_OTP, HttpStatus.INTERNAL_SERVER_ERROR);

        const preliminaryToken = this.tokenService.createEmailVerificationToken({
            userId: employee.id,
            role: employee.role,
        });

        await this.emailQueueService.sendForgotPasswordMail(
            employee.email,
            employee.name,
            otpResult.plainOtp
        );
        this.logger.log(`Successfully sent forgot password OTP to ${employee.email} with OTP: ${otpResult.plainOtp}`);

        return {
            message: SYS_MSG.EMAIL_SENT,
            token: preliminaryToken,
        };
    }

    async verifyForgetPasswordOtp(authorization: string, verifyOtp: { otp: string }) {
        const employee = await this.authHelperService.validateBearerToken(authorization) as Employee;

        const isValidOtp = await this.otpService.verify(employee.id, verifyOtp.otp, true);
        if (!isValidOtp) {
            throw new CustomHttpException(SYS_MSG.INVALID_OTP, HttpStatus.UNAUTHORIZED);
        }

        return {
            message: SYS_MSG.OTP_VERIFIED_SUCCESSFULLY,
            data: {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
            },
        };
    }

    async updateForgotPassword(authorization: string, updatePasswordDto: UpdatePasswordDto) {
        const employee = await this.authHelperService.validateBearerToken(authorization) as Employee;

        const otpVerified = await this.otpService.isOtpVerified(employee.id, true);
        if (!otpVerified) throw new CustomHttpException(SYS_MSG.OTP_VERIFIED, HttpStatus.UNAUTHORIZED);

        const { new_password } = updatePasswordDto;

        const isSamePassword = await this.passwordService.comparePassword(new_password, employee.password);
        if (isSamePassword) throw new CustomHttpException(SYS_MSG.DUPLICATE_PASSWORD, HttpStatus.BAD_REQUEST);

        const hashedPassword = await this.passwordService.hashPassword(new_password);

        await Promise.all([
            this.employeeRepository.update(employee.id, { password: hashedPassword }),
            this.otpService.remove(employee.id, true)
        ]);


        await this.emailQueueService.sendPasswordChangedMail(
            employee.email,
            employee.name,
            new Date().toISOString()
        );

        return {
            message: SYS_MSG.PASSWORD_UPDATED,
        };
    }


} 