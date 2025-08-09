import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from "@nestjs/swagger";
import { ProjectPriority, ProjectStatus } from '../entities/project.entity';

export class CreateProjectDto {

    @ApiProperty({ description: 'The project name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'The project description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'The project start date' })
    @IsDateString()
    start_date: string;


    @ApiProperty({ description: 'The project end date' })
    @IsOptional()
    @IsDateString()
    end_date?: string;

    @ApiProperty({ description: 'The project priority ' })
    @IsOptional()
    @IsEnum(ProjectPriority)
    priority?: ProjectPriority;

    @ApiProperty({ description: 'The project value ' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    project_value?: number;


    @ApiProperty({ description: 'The project status ' })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;


    @ApiProperty({ description: 'The client who own the project id' })
    @IsOptional()
    @IsUUID()
    client_id?: string;

    @ApiProperty({ description: 'The employee working on the project id' })
    @IsOptional()
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    @IsArray()
    @IsUUID(undefined, { each: true })
    team_member_ids?: string[];

    @ApiProperty({ description: 'The employee(s) working as team lead on the project', })
    @IsOptional()
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    @IsArray()
    @IsUUID(undefined, { each: true })
    team_leader_ids?: string[];

    @ApiProperty({ description: 'The client image' })
    @IsString()
    @IsOptional()
    project_image_url?: string;

}