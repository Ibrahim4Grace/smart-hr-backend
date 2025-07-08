import { Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { CachePrefixesService } from '../cache/cache.prefixes.service';

export abstract class BaseCacheableService {
    protected readonly logger = new Logger(this.constructor.name);

    constructor(
        protected readonly cacheService: CacheService,
        protected readonly cachePrefixes: CachePrefixesService,
    ) { }

    /**
     * Cache a method result with automatic key generation
     */
    protected async cacheResult<T>(
        prefix: string,
        key: string | number,
        fetchFn: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        return this.cacheService.getOrSet(prefix, key, fetchFn, ttl);
    }

    /**
     * Invalidate individual cache entry
     */
    protected async invalidateCache(prefix: string, key: string | number): Promise<void> {
        try {
            await this.cacheService.delete(prefix, key);
            this.logger.debug(`Invalidated cache: ${prefix}:${key}`);
        } catch (error) {
            this.logger.error(`Failed to invalidate cache: ${prefix}:${key}`, error.stack);
        }
    }

    /**
     * Invalidate all cache entries with a specific prefix
     */
    protected async invalidateCacheByPrefix(prefix: string): Promise<void> {
        try {
            await this.cacheService.deleteByPrefix(prefix);
            this.logger.debug(`Invalidated cache prefix: ${prefix}`);
        } catch (error) {
            this.logger.error(`Failed to invalidate cache prefix: ${prefix}`, error.stack);
        }
    }

    /**
     * Invalidate multiple cache entries
     */
    protected async invalidateMultipleCaches(invalidations: Array<{ prefix: string; key?: string | number }>): Promise<void> {
        try {
            await Promise.all(
                invalidations.map(({ prefix, key }) =>
                    key ? this.cacheService.delete(prefix, key) : this.cacheService.deleteByPrefix(prefix)
                )
            );
            this.logger.debug(`Invalidated ${invalidations.length} cache entries`);
        } catch (error) {
            this.logger.error('Failed to invalidate multiple caches', error.stack);
        }
    }

    /**
     * Generate cache key for paginated results
     */
    protected generatePaginationCacheKey(userId: string, options: any, additionalParams?: Record<string, any>): string {
        const baseKey = `user:${userId}:page:${options.page || 1}:limit:${options.limit || 10}`;

        if (additionalParams) {
            const params = Object.entries(additionalParams)
                .map(([key, value]) => `${key}:${value}`)
                .join(':');
            return `${baseKey}:${params}`;
        }

        return baseKey;
    }

    /**
     * Standard cache invalidation for CRUD operations
     */
    protected async invalidateOnCreate(userId: string, entityPrefix: string): Promise<void> {
        await this.invalidateCacheByPrefix(`${entityPrefix}:list:user:${userId}`);
    }

    protected async invalidateOnUpdate(entityId: string, userId: string, entityPrefix: string): Promise<void> {
        await this.invalidateMultipleCaches([
            { prefix: `${entityPrefix}:id`, key: entityId },
            { prefix: `${entityPrefix}:list:user:${userId}` }
        ]);
    }

    protected async invalidateOnDelete(entityId: string, userId: string, entityPrefix: string): Promise<void> {
        await this.invalidateMultipleCaches([
            { prefix: `${entityPrefix}:id`, key: entityId },
            { prefix: `${entityPrefix}:list:user:${userId}` }
        ]);
    }
} 