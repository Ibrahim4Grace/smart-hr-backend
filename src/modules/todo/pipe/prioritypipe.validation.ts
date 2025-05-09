import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { TodoPriority } from '../entities/todo.entity';

@Injectable()
export class PriorityValidationPipe implements PipeTransform {
    readonly allowedPriorities = Object.values(TodoPriority);

    transform(value: any) {
        if (!value) throw new BadRequestException('Priority is required');

        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

        if (!this.isValidPriority(value)) {
            throw new BadRequestException(`Priority must be one of: ${this.allowedPriorities.join(', ')}`);
        }

        return value;
    }

    private isValidPriority(priority: any): boolean {
        return this.allowedPriorities.includes(priority);
    }
}