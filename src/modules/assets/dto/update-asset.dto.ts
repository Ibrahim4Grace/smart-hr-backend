

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsEnum, IsOptional, IsString } from "class-validator";
import { AssetStatus } from "../entities/asset.entity"

export class UpdateAssetDto {
    @ApiProperty({ description: 'Asset type' })
    @IsOptional()
    @IsString()
    type: string;

    @ApiProperty({ description: 'Asset cost' })
    @IsOptional()
    @IsString()
    cost: string;

    @ApiProperty({ description: 'Asset purchase date' })
    @IsOptional()
    @IsDate()
    purchase_date: Date;

    @ApiProperty({ description: 'Asset warranty period' })
    @IsOptional()
    @IsString()
    warranty_period: string;

    @ApiProperty({ description: 'Single serial number' })
    @IsOptional()
    @IsString()
    serial_number?: string;

    @ApiProperty({ description: 'Asset vendor' })
    @IsOptional()
    @IsString()
    purchase_from: string;

    @ApiProperty({ description: 'ID of assigned employee', required: false })
    @IsOptional()
    @IsString()
    employee_id?: string;

    @ApiProperty({ description: 'Asset image URL' })
    @IsOptional()
    @IsString()
    asset_image_url: string;

    @ApiProperty({ description: 'Asset report issue' })
    @IsOptional()
    @IsString()
    report_issue: string;

    @ApiPropertyOptional({ description: 'Asset status', enum: AssetStatus })
    @IsOptional()
    @IsEnum(AssetStatus)
    status: AssetStatus;

}

