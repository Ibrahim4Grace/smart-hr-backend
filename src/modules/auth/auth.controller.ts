import { ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import * as SYS_MSG from '@shared/constants/SystemMessages';
import { skipAuth } from '@shared/helpers/skipAuth';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { OtpDto } from '../otp/dto/create-otp.dto';
import { ErrorCreateUserResponse, SuccessCreateUserResponse } from '../user/dto/create-user.dto';
import { Body, Controller, HttpCode,Post, Patch, Headers } from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @skipAuth()
  @ApiOperation({ summary: 'User Registration' })
  @ApiResponse({ status: 201, description: 'Register a new user', type: SuccessCreateUserResponse })
  @ApiResponse({ status: 400, description: 'User already exists', type: ErrorCreateUserResponse })
  @Post('register')
  @HttpCode(201)
  public async create(@Body() createAuthDto: CreateAuthDto): Promise<any> {
    return this.authService.create(createAuthDto);
  }

  @skipAuth()
  @ApiOperation({ summary: 'Verify registration otp' })
  @ApiBody({ type: AuthResponseDto })
  @ApiResponse({ status: 200, description: 'successfully verifies otp and logs in user' })
  @ApiResponse({ status: 401, description: SYS_MSG.UNAUTHORISED_TOKEN })
  @HttpCode(200)
  @Post('verify-otp')
  public async verifyEmail(@Headers('authorization') authorization: string, @Body() verifyOtp: OtpDto) {
    return this.authService.verifyToken(authorization, verifyOtp);
  }

  @skipAuth()
  @HttpCode(200)
  @Post('password/forgot')
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

  @skipAuth()
  @ApiOperation({ summary: 'Verify reset password otp' })
  @ApiBody({ type: AuthResponseDto })
  @ApiResponse({ status: 200, description: 'successfully verifies otp kindly reset your password' })
  @ApiResponse({ status: 401, description: SYS_MSG.UNAUTHORISED_TOKEN })
  @HttpCode(200)
  @Post('password/verify-otp')
  public async verifyResetPasswordEmail(@Headers('authorization') authorization: string, @Body() verifyOtp: OtpDto) {
    return this.authService.verifyForgetPasswordOtp(authorization, verifyOtp);
  }

  @skipAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully', type: UpdatePasswordResponseDTO })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch('password/reset')
  @HttpCode(200)
  public async resetPassword(
    @Headers('authorization') authorization: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.authService.updateForgotPassword(authorization, updatePasswordDto);
  }

  @skipAuth()
  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials', type: LoginErrorResponseDto })
  @HttpCode(200)
  public async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);

  }

  @skipAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Access token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @HttpCode(200)
  @Post('refresh')
  public async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refresh_token);
  }
}
