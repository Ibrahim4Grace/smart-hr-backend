import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateChatDto {
    @ApiProperty({ description: 'Message content' })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({ description: 'Chat room ID' })
    @IsString()
    @IsNotEmpty()
    chatRoomId: string;

    @ApiProperty({ description: 'File URL (optional)', required: false })
    @IsString()
    @IsOptional()
    fileUrl?: string;
}
