import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TodoPriority, TodoStatus, TodoTag } from '../entities/todo.entity';

export class UpdateTodoDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TodoTag)
    @IsOptional()
    tag?: TodoTag;

    @IsEnum(TodoPriority)
    @IsOptional()
    priority?: TodoPriority;

    @IsEnum(TodoStatus)
    @IsOptional()
    status?: TodoStatus;

    @IsString()
    @IsOptional()
    assignedTo?: string;
}
