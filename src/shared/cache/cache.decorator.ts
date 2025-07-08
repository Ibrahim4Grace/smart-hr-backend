import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key_metadata';
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';

export interface CacheOptions {
    prefix: string;
    key?: string | ((args: any[]) => string);
    ttl?: number;
    invalidateOn?: {
        create?: boolean;
        update?: boolean;
        delete?: boolean;
    };
}

/**
 * Decorator to cache method results
 * @param options Cache configuration options
 */
export function CacheResult(options: CacheOptions) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        SetMetadata(CACHE_KEY_METADATA, options)(target, propertyKey, descriptor);
        return descriptor;
    };
}

/**
 * Decorator to invalidate cache after method execution
 * @param options Cache invalidation options
 */
export function InvalidateCache(options: {
    prefix: string;
    key?: string | ((args: any[]) => string);
    deleteByPrefix?: boolean;
}) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        SetMetadata('invalidate_cache', options)(target, propertyKey, descriptor);
        return descriptor;
    };
} 