import { ApiProperty } from '@nestjs/swagger';
import { UserInterface } from '../interface/User.interface';
import { IsEnum, IsString, IsBoolean, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class GetUserByIdResponseDto {
  status_code: 200;
  user: Omit<Partial<UserInterface>, 'password'>;

  constructor(user: Omit<Partial<UserInterface>, 'password'>) {
    this.user = user;
  }
}

export class GetUserStatsResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ example: 'User statistics retrieved successfully' })
  message: string;

  @ApiProperty({
    example: {
      total_users: 100,
      active_users: 80,
      deleted_users: 20,
    },
  })
  data: {
    total_users: number;
    active_users: number;
    deleted_users: number;
  };
}

export enum FileFormat {
  JSON = 'json',
  XLSX = 'xlsx',
}

export class UserDataExportDto {
  @IsEnum(FileFormat)
  format: FileFormat;
}

export class DeleteUserResponse {
  status: string;
  message: string;
}

class ErrorCreateUserResponse {
  status_code: number;
  message: string;
}

class SuccessCreateUserResponse {
  status_code: number;
  message: string;
  data: {
    user: {
      name: string;
      email: string;
      created_at: Date;
    };
  };
}

export { ErrorCreateUserResponse, SuccessCreateUserResponse };

export type UserResponseDTO = Partial<UserInterface>;

export class PaginatedUsersResponse {
  status: string;
  message: string;
  data: {
    users: UserResponseDTO[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_users: number;
    };
  };
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Son',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'The address of the user',
    example: '123 Main St, City, Country',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export interface UpdateUserResponseDTO {
  status: string;
  message: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
}

export class UpdateUserStatusDto {
  @IsString()
  status: string;
}

export class DeactivateAccountDto {
  @ApiProperty({
    example: true,
    description: 'Email to deactivate the account',
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'No longer needed',
    description: 'Optional reason for deactivating the account',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ReactivateAccountDto {
  @ApiProperty({
    example: true,
    description: 'Email to reactivate the account',
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Now needed',
    description: 'Optional reason for reactivating the account',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
