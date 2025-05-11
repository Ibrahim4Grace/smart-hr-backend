import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreateChatRoomDto {
    @ApiProperty({ description: 'Chat room name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Participant IDs (exactly 2)' })
    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    @IsString({ each: true })
    participantIds: string[];
} 