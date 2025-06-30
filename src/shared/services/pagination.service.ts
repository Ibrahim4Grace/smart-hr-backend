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

        const findOptions: any = {
            where,
            relations,
            order,
            skip: (page - 1) * limit,
            take: limit,
        };

        if (select) findOptions.select = select;

        const [data, total] = await repository.findAndCount(findOptions);
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