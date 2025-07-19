import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateDesignationDto {
    @ApiProperty({ description: 'The name of the designation' })
    @IsNotEmpty()
    @IsString()
    name: string;
}


export class DeleteDesignationResponse {
    message: string;
}