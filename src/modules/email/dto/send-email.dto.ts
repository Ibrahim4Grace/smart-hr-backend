// send-email.dto.ts
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
    @ApiProperty({ description: 'Email recipient' })
    @IsEmail()
    @IsNotEmpty()
    to: string;

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

    @ApiProperty({ description: 'Email subject' })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({ description: 'Email body (HTML supported)' })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiPropertyOptional({ description: 'Attachments', type: [Object] })
    @IsOptional()
    attachments?: any[];
}
