import { ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiBadRequestResponse, ApiBody, ApiOperation } from '@nestjs/swagger';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { skipAuth } from '@shared/helpers/skipAuth';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { OtpDto } from '@shared/otp/dto/create-otp.dto';
import { ErrorCreateUserResponse, SuccessCreateUserResponse } from '../user/dto/create-user.dto';
import { Body, Controller, HttpCode, Post, Patch, Headers } from '@nestjs/common';
import { EmployeeAuthService } from './employee-auth.service';
import { ApiTags } from '@nestjs/swagger';
import {
  LoginDto,
  LoginResponseDto,
  ForgotPasswordDto,
  AuthResponseDto,
  ForgotPasswordResponseDto,
  UpdatePasswordDto,
  LoginErrorResponseDto,
  UpdatePasswordResponseDTO,
  RefreshTokenDto,
} from './dto/create-auth.dto';

@ApiTags('Auth')
@skipAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly employeeAuthService: EmployeeAuthService
  ) { }


  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateAuthDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: SuccessCreateUserResponse
  })
  @ApiBadRequestResponse({
    description: 'User already exists',
    type: ErrorCreateUserResponse
  })
  public async create(@Body() createAuthDto: CreateAuthDto): Promise<any> {
    return this.authService.create(createAuthDto);
  }


  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify registration OTP' })
  @ApiBody({ type: OtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: AuthResponseDto
  })
  @ApiUnauthorizedResponse({
    description: SYS_MSG.UNAUTHORISED_TOKEN
  })
  public async verifyEmail(
    @Headers('authorization') authorization: string,
    @Body() verifyOtp: OtpDto) {
    return this.authService.verifyToken(authorization, verifyOtp);
  }


  @Post('password/forgot')
  @HttpCode(200)
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOperation({ summary: 'Generate forgot password reset token' })
  @ApiResponse({
    status: 200,
    description: 'The forgot password reset token generated successfully',
    type: ForgotPasswordResponseDto,
  })
  @ApiBadRequestResponse({ description: SYS_MSG.USER_ACCOUNT_DOES_NOT_EXIST })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<any> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }


  @Post('password/verify-otp')
  @ApiOperation({ summary: 'Verify reset password otp' })
  @ApiBody({ type: AuthResponseDto })
  @ApiResponse({ status: 200, description: 'successfully verifies otp kindly reset your password' })
  @ApiResponse({ status: 401, description: SYS_MSG.UNAUTHORISED_TOKEN })
  @HttpCode(200)
  public async verifyResetPasswordEmail(
    @Headers('authorization') authorization: string,
    @Body() verifyOtp: OtpDto) {
    return this.authService.verifyForgetPasswordOtp(authorization, verifyOtp);
  }


  @Patch('password/reset')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully', type: UpdatePasswordResponseDTO })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(200)
  public async resetPassword(
    @Headers('authorization') authorization: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.authService.updateForgotPassword(authorization, updatePasswordDto);
  }


  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials', type: LoginErrorResponseDto })
  @HttpCode(200)
  public async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);

  }


  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Access token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @HttpCode(200)
  public async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refresh_token);
  }

  @Post('employee/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Employee login' })
  @ApiResponse({ status: 200, description: 'Employee Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async employeeLogin(@Body() loginDto: { email: string; password: string }) {
    return this.employeeAuthService.login(loginDto.email, loginDto.password);
  }

  @Post('employee/password/forgot')
  @HttpCode(200)
  @ApiOperation({ summary: 'Employee Request password reset' })
  @ApiResponse({ status: 200, description: 'Employee Reset email sent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async employeeForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.employeeAuthService.forgotPassword(forgotPasswordDto);
  }

  @Post('employee/password/verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Employee Verify OTP for password reset' })
  @ApiResponse({ status: 200, description: 'Employee OTP verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid OTP' })
  async employeeVerifyOtp(
    @Headers('authorization') authorization: string,
    @Body() verifyOtp: OtpDto) {
    return this.employeeAuthService.verifyForgetPasswordOtp(authorization, verifyOtp);
  }

  @Patch('employee/password/reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Employee Reset password after OTP verification' })
  @ApiResponse({ status: 200, description: 'Employee Password reset successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async employeeResetPassword(
    @Headers('authorization') authorization: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.employeeAuthService.updateForgotPassword(authorization, updatePasswordDto);
  }
}
