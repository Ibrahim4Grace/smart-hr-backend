import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
    @ApiProperty({ description: 'First name of the employee' })
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @ApiProperty({ description: 'Last name of the employee' })
    @IsString()
    @IsNotEmpty()
    last_name?: string;

    @ApiProperty({ description: 'Employee ID (Auto generated EMP-0024)' })
    @IsString()
    @IsNotEmpty()
    employee_id: string;

    @ApiProperty({ description: 'Joining date of the employee' })
    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    joining_date: Date;

    @ApiProperty({ description: 'Email of the employee' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Password for the employee account' })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({ description: 'Phone number of the employee' })
    @IsString()
    @IsNotEmpty()
    phone_number: string;

    @ApiProperty({ description: 'Company name' })
    @IsString()
    @IsNotEmpty()
    company: string;

    @ApiProperty({ description: 'Department of the employee' })
    @IsString()
    @IsNotEmpty()
    department: string;

    @ApiProperty({ description: 'Designation of the employee' })
    @IsString()
    @IsNotEmpty()
    designation: string;

    @ApiProperty({ description: 'Profile picture URL' })
    @IsString()
    @IsOptional()
    employee_profile_pic_url?: string;
}
