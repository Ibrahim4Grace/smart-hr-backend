import { Injectable } from '@nestjs/common';
import { Repository, FindOptionsOrder } from 'typeorm';
import { PaginatedResponse, PaginationOptions } from '../interfaces/pagination.interface';

@Injectable()
export class PaginationService {
    async paginate<T>(
        repository: Repository<T>,
        where: any,
        options: PaginationOptions<T> = {},
    ): Promise<PaginatedResponse<T>> {
        const { page = 1, limit = 10, order = { created_at: 'DESC' } as unknown as FindOptionsOrder<T>, relations = [], select } = options;

        const [data, total] = await repository.findAndCount({
            where,
            relations,
            order,
            select,
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
} 