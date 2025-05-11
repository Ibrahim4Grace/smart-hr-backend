import { IsString, IsEnum, IsDateString, IsArray, MaxLength, IsNotEmpty, IsDate } from 'class-validator';
import { NotePriority, NoteStatus } from '../entities/note.entity';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
    @ApiProperty({ description: 'Note title' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiProperty({ description: 'Note content' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ description: 'Note tags' })
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @ApiProperty({ description: 'Note priority' })
    @IsEnum(NotePriority)
    @IsNotEmpty()
    priority: NotePriority;

    @ApiProperty({ description: 'Note status' })
    @IsEnum(NoteStatus)
    @IsNotEmpty()
    status: NoteStatus;

    @ApiProperty({ description: 'Note due date' })
    @IsDate()
    @Type(() => Date)
    dueDate: Date;

    @ApiProperty({ description: 'Note assigned to' })
    @IsString()
    @IsNotEmpty()
    assigned_to: string;
}
