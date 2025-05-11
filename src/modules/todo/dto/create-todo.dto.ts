import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { TodoPriority, TodoStatus, TodoTag } from '../entities/todo.entity';

export class CreateTodoDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsEnum(TodoTag)
    tag: TodoTag;

    @IsEnum(TodoPriority)
    priority: TodoPriority;

    @IsEnum(TodoStatus)
    status: TodoStatus;

    @IsString()
    @IsNotEmpty()
    assigned_to: string;
}
