import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { NotePriority } from '../entities/note.entity';

@Injectable()
export class PriorityValidationPipe implements PipeTransform {
    readonly allowedPriorities = Object.values(NotePriority);

    transform(value: any) {
        if (!value) throw new BadRequestException('Priority is required');

        value = value.toLowerCase();

        if (!this.isValidPriority(value)) {
            throw new BadRequestException(`Priority must be one of: ${this.allowedPriorities.join(', ')}`);
        }

        return value;
    }

    private isValidPriority(priority: any): boolean {
        return this.allowedPriorities.includes(priority);
    }
}