
import { IsOptional, IsIn, IsInt, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceFilterDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    createdDate?: string;

    @IsOptional()
    @IsString()
    dueDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minAmount?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxAmount?: number;

    @IsOptional()
    @IsString()
    sort: string = 'created_at';

    @IsOptional()
    @IsIn(['asc', 'desc'])
    order: 'asc' | 'desc' = 'desc';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit: number = 9;
}
