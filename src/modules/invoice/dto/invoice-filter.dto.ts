
import { IsOptional, IsIn, IsInt, IsString } from 'class-validator';
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
