import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { AssetStatus } from "../entities/asset.entity";
import { Type } from 'class-transformer';


export class AssetFilterDto {
    @ApiProperty({
        description: 'Filter assets by status',
        enum: AssetStatus,
        required: false
    })
    @IsOptional()
    @IsEnum(AssetStatus)
    status?: AssetStatus;

    @IsOptional()
    @IsString()
    purchaseDateFrom?: string;

    @IsOptional()
    @IsString()
    purchaseDateTo?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit: number = 9;
} 