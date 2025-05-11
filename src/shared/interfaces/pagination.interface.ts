import { FindOptionsOrder } from 'typeorm';

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface PaginationOptions<T> {
    page?: number;
    limit?: number;
    order?: FindOptionsOrder<T>;
    relations?: string[];
    select?: (keyof T)[];
} 