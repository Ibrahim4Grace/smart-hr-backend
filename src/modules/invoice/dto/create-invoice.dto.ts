import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString, IsNumber, ValidateNested, IsEnum, IsUUID, IsNumberString } from "class-validator";
import { Type } from 'class-transformer';
import { InvoiceStatus } from "../entities/invoice.entity";

export class InvoiceItemDto {
    @ApiProperty({ description: 'The description of the invoice item' })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({ description: 'The quantity of the invoice item' })
    @IsNumber()
    @IsOptional()
    quantity: number;

    @ApiProperty({ description: 'The discount of the invoice item' })
    @IsNumber()
    @IsOptional()
    discount: number;

    @ApiProperty({ description: 'The rate of the invoice item' })
    @IsNumber()
    @IsOptional()
    rate: number;
}

export class CreateInvoiceDto {
    @ApiProperty({ description: 'The title of the invoice' })
    @IsString()
    @IsNotEmpty()
    invoice_title: string;

    @ApiProperty({ description: 'The date of the invoice' })
    @IsNotEmpty()
    invoice_date: Date;

    @ApiProperty({ description: 'The due date of the invoice' })
    @IsNotEmpty()
    due_date: Date;

    @ApiProperty({ description: 'The customer ID for this invoice' })
    @IsUUID()
    @IsNotEmpty()
    customer_id: string;

    @ApiProperty({ description: 'The payment type of the invoice' })
    @IsString()
    @IsNotEmpty()
    payment_type: string;

    @ApiProperty({ description: 'The bank account name of the invoice' })
    @IsString()
    @IsNotEmpty()
    bank_name: string;

    @ApiProperty({ description: 'The notes of the invoice' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ description: 'The items of the invoice', type: [InvoiceItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    @IsOptional()
    items?: InvoiceItemDto[];

    @ApiProperty({ description: 'The status of the invoice' })
    @IsEnum(InvoiceStatus)
    @IsOptional()
    status?: InvoiceStatus;
}
