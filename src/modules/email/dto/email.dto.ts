import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsObject } from 'class-validator';

export class CreateTemplateResponseDto {
  @ApiProperty({ enum: HttpStatus, description: 'HTTP status code' })
  status_code: HttpStatus;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ type: [String], description: 'List of validation errors', required: false })
  validation_errors?: string[];
}

export class SendEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  to: string;

  @ApiProperty({ description: 'Email subject' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Email template name' })
  @IsNotEmpty()
  @IsString()
  template: string;

  @ApiProperty({ description: 'Context data for the email template', type: Object })
  @IsNotEmpty()
  @IsObject()
  context: object;
}

export class createTemplateDto {
  @ApiProperty({ description: 'Name of the template' })
  @IsString()
  templateName: string;

  @ApiProperty({ description: 'HTML content of the template' })
  @IsString()
  template: string;
}

export class UpdateTemplateDto {
  @ApiProperty({ description: 'Updated HTML content of the template' })
  @IsString()
  @IsNotEmpty()
  template: string;
}

export class getTemplateDto {
  @ApiProperty({ description: 'Name of the template to retrieve' })
  @IsString()
  templateName: string;
}

export class ErrorResponseDto {
  @ApiProperty({ enum: HttpStatus, description: 'HTTP status code' })
  status_code: HttpStatus;

  @ApiProperty({ description: 'Response message' })
  message: string;
}

export class TemplateDto {
  @ApiProperty({ description: 'Template name' })
  template_name: string;

  @ApiProperty({ description: 'Template content' })
  content: string;
}

export class GetAllTemplatesResponseDto {
  @ApiProperty({ enum: HttpStatus, description: 'HTTP status code' })
  status_code: HttpStatus;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ type: [TemplateDto], description: 'List of templates', required: false })
  templates?: TemplateDto[];
}
export class GetTemplateResponseDto {
  @ApiProperty({ enum: HttpStatus, description: 'HTTP status code' })
  status_code: HttpStatus;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Template content', required: false })
  template?: string;
}

export class UpdateTemplateDataDto {
  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Template content' })
  content: string;
}

export class UpdateTemplateResponseDto {
  @ApiProperty({ enum: HttpStatus, description: 'HTTP status code' })
  status_code: HttpStatus;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ type: () => UpdateTemplateDataDto, description: 'Updated template data', required: false })
  data?: UpdateTemplateDataDto;
}
