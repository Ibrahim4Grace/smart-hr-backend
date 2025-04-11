import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole } from '@modules/auth/enum/usertype';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
  IsStrongPassword,
  IsBoolean,
  ValidateNested,
  ValidationArguments,
} from 'class-validator';

export class AdminDetails {
  @ApiProperty({ description: 'The can_approve_requests of the admin' })
  @IsNotEmpty()
  @IsBoolean()
  can_approve_requests: boolean;
}

export class CreateAuthDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Son',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'The password for the user account.\
        It must contain at least one uppercase letter, one lowercase letter,\
        one number, and one special character.',
    example: 'P@ssw0rd!',
  })
  @MinLength(8)
  @IsNotEmpty()
  @IsStrongPassword(
    {},
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  password: string;

  @ApiProperty({
    description: 'The type of the user',
    example: 'borrower',
  })
  @ApiProperty({
    description: 'The type of the user',
    example: 'admin, hr ',
    enum: UserRole,
  })
  @IsNotEmpty()
  @IsEnum(UserRole, {
    message: 'Invalid user type. Valid values are: admin, hr',
  })
  role: UserRole;

  @ApiProperty({
    description: 'Role-specific details (varies by role)',
    oneOf: [{ $ref: '#/components/schemas/AdminDetails' }],
    required: false,
  })
  @ValidateNested()
  @Type((options) => {
    switch (options?.object.role) {
      case UserRole.ADMIN:
        return AdminDetails;
      default:
        return Object;
    }
  })
  @ValidateIf((o) => o.role !== UserRole.USER) // Only validate if role is not USER
  @IsNotEmpty({
    message: (validationArguments: ValidationArguments) => {
      const role = (validationArguments.object as any).role;
      switch (role) {
        case UserRole.ADMIN:
          return 'Admin details are required. Please provide admin-specific information.';
        default:
          return 'Details are required for this role';
      }
    },
    groups: [UserRole.ADMIN],
  })
  details?: AdminDetails;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Status message of the authentication response',
    example: 'Authentication successful',
  })
  message: string;

  @ApiProperty({
    description: 'Access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Additional data containing user object',
    type: 'object',
    additionalProperties: true,
  })
  data: object;
}

export class ForgotPasswordResponseDto {
  status_code: number;
  message: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'john@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'The new password of the user',
  })
  @MinLength(8)
  @IsNotEmpty()
  @IsStrongPassword(
    {},
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  newPassword: string;

  @ApiProperty({
    description: 'Confirm the password of the user',
  })
  @MinLength(8)
  @IsNotEmpty()
  @IsStrongPassword(
    {},
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  confirmPassword?: string;
}

export class UserDto {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '12345',
  })
  id: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John',
  })
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  email: string;
}

export class UpdatePasswordResponseDTO {
  @ApiProperty({
    description: 'Status of the password update operation',
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Message providing additional information about the password update',
    example: 'Password updated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Details of the updated user',
    type: UserDto,
  })
  user: UserDto;
}

export class LoginErrorResponseDto {
  @ApiProperty({
    description: 'Error message providing details about the login failure',
    example: 'Invalid credentials provided',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code indicating the type of error',
    example: 401,
  })
  status_code: number;
}

export class LoginDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  readonly password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Status message of the login response',
    example: 'Login successful',
  })
  message: string;

  @ApiProperty({
    description: 'Access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token for getting new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Additional data containing user object',
    type: 'object',
    additionalProperties: true,
  })
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to get new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;
}
