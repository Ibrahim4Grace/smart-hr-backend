import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ description: 'Current password of the employee' })
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @ApiProperty({ description: 'New password for the employee account' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    newPassword: string;

} 