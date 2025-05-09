

import { IsString, IsNotEmpty, IsOptional, IsArray, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReplyEmailDto {
    @ApiPropertyOptional({ description: 'Carbon copy recipients', type: [String] })
    @IsEmail({}, { each: true })
    @IsArray()
    @IsOptional()
    cc?: string[];

    @ApiPropertyOptional({ description: 'Blind carbon copy recipients', type: [String] })
    @IsEmail({}, { each: true })
    @IsArray()
    @IsOptional()
    bcc?: string[];

    @ApiProperty({ description: 'Email body (HTML supported)' })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiPropertyOptional({ description: 'Attachments', type: [Object] })
    @IsOptional()
    attachments?: any[];
}