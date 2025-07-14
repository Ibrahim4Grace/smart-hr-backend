import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsEmail } from "class-validator";

export class CreateCustomerDto {
    @ApiProperty({ description: 'The full name of the customer' })
    @IsString()
    @IsNotEmpty()
    full_name: string;

    @ApiProperty({ description: 'The email of the customer' })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'The phone of the customer' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ description: 'The company of the customer' })
    @IsString()
    @IsNotEmpty()
    company: string;

    @ApiProperty({ description: 'The address of the customer' })
    @IsString()
    @IsNotEmpty()
    address: string;
}
