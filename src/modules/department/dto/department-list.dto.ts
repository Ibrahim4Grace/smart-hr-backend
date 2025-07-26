import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { DepartmentStatus } from '../entities/department.entity';

export class DepartmentListResponseDto {
    @ApiProperty({ description: 'Department ID' })
    id: string;

    @ApiProperty({ description: 'Department name' })
    name: string;

    @ApiProperty({ description: 'Department status', enum: DepartmentStatus })
    status: string;

    @ApiProperty({ description: 'Number of employees in this department' })
    employee_count: number;

    @ApiProperty({ description: 'When the department was created' })
    created_at: Date;

    @ApiProperty({ description: 'When the department was last updated' })
    updated_at: Date;
}

export class DepartmentFilterDto {
    @ApiProperty({
        description: 'Filter departments by status',
        enum: DepartmentStatus,
        required: false
    })
    @IsOptional()
    @IsEnum(DepartmentStatus)
    status?: DepartmentStatus;
} 