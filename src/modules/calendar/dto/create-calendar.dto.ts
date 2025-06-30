import { IsString, IsNotEmpty, IsDate, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateCalendarDto {
    @ApiProperty({ description: 'Title of the event' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'Event date' })
    @IsDate()
    @Type(() => Date)
    event_date: Date;

    @ApiProperty({ description: 'Start date and time of the event' })
    @IsDate()
    @Type(() => Date)
    start_time: Date;

    @ApiProperty({ description: 'End date and time of the event' })
    @IsDate()
    @Type(() => Date)
    end_time: Date;

    @ApiPropertyOptional({ description: 'Location of the event' })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({ description: 'Description of the event' })
    @IsString()
    @IsOptional()
    description?: string;
}