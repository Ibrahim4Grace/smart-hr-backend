
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateDepartmentDto {
    @ApiProperty({ description: 'The name of the department' })
    @IsNotEmpty()
    @IsString()
    name: string;
}


export class DeleteDepartmentResponse {
    message: string;
}