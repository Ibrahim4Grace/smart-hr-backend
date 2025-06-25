import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, Min, IsInt, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { AccessType, Region, Duration, Currency } from '../interface/price.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Optional } from '@nestjs/common';

export class CreatePricingDto {
    @ApiProperty({
        description: 'Name of the pricing plan',
        example: 'Enterprise HR Plan',
    })
    @IsString()
    @IsNotEmpty()
    plan_name: string;

    @ApiProperty({
        description: 'Price of the plan',
        example: 100,
    })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({
        description: 'currency of the plan',
        example: Currency.USD,
    })
    @IsString()
    @IsNotEmpty()
    currency: Currency.NGN;

    @ApiProperty({
        description: 'Region of the plan',
        enum: Region,
        example: Region.INTERNATIONAL,
    })
    @IsEnum(Region)
    region: Region;

    @ApiProperty({
        description: 'Access type of the plan',
        enum: AccessType,
        example: AccessType.HR_AND_EMPLOYEE,
    })
    @IsEnum(AccessType)
    access_type: AccessType;

    @ApiProperty({
        description: 'Maximum number of employees allowed.',
        example: 10,
    })
    @IsNumber()
    @Min(0)
    @Optional()
    max_employees: number;

    @ApiProperty({
        description: 'Features included in the plan',
        example: 'Advanced HR features, Employee self-service, Advanced reporting',
    })
    @IsString()
    features: string;


    @ApiProperty({
        description: 'Duration of the plan',
        example: Duration.MONTHLY,
    })
    @IsEnum(Duration)
    duration: Duration.MONTHLY;

    @ApiProperty({
        description: 'Whether the plan is active',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
