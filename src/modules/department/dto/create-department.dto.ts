
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDepartmentDto {
    @ApiProperty({ description: 'The name of the department' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'The status of the department' })
    @IsOptional()
    @IsString()
    status: string;

}


export class DeleteDepartmentResponse {
    message: string;
}