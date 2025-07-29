import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsDate, IsEnum, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from "class-validator";
import { AssetStatus } from "../entities/asset.entity"
import { Type } from "class-transformer";

export class CreateSingleAssetDto {
    @ApiProperty({ description: 'Asset type' })
    @IsNotEmpty()
    @IsString()
    type: string;

    @ApiProperty({ description: 'Asset cost' })
    @IsOptional()
    @IsNumber()
    cost: number;

    @ApiProperty({ description: 'Asset purchase date' })
    @IsOptional()
    @IsDate()
    purchase_date: Date;

    @ApiProperty({ description: 'Asset warranty period' })
    @IsOptional()
    @IsString()
    warranty_period: string;

    @ApiProperty({ description: 'Serial numbers array for multiple items' })
    @IsNotEmpty()
    @IsString()
    serial_number: string;

    @ApiProperty({ description: 'Asset vendor' })
    @IsOptional()
    @IsString()
    purchase_from: string;

    @ApiProperty({ description: 'Assest ID of the employee' })
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

export class CreateAssetDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSingleAssetDto)
    assets: CreateSingleAssetDto[];
}

export class DeleteAssetResponse {
    message: string;
}