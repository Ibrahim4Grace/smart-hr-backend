import { IsString, IsEnum, IsDateString, IsArray, MaxLength, IsNotEmpty, IsDate } from 'class-validator';
import { NotePriority, NoteStatus } from '../entities/note.entity';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @IsEnum(NotePriority)
    @IsNotEmpty()
    priority: NotePriority;

    @IsEnum(NoteStatus)
    @IsNotEmpty()
    status: NoteStatus;

    @ApiProperty({ description: 'Note due date' })
    @IsDate()
    @Type(() => Date)
    dueDate: Date;

    @IsString()
    @IsNotEmpty()
    assignee: string;
}
