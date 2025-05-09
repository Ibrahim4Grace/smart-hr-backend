import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CachePrefixesService } from './cache.prefixes.service';
import { RedisStore } from 'cache-manager-redis-store';

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);

    // Default cache durations in milliseconds
    readonly CACHE_TTL = {
        // SHORT: 60000,        // 1 minute
        // MEDIUM: 300000,      // 5 minutes
        // LONG: 3600000,       // 1 hour
        // VERY_LONG: 86400000, // 24 hours
        SHORT: 60000,
        MEDIUM: 60000,
        LONG: 60000,
        VERY_LONG: 60000,
    };

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private configService: ConfigService,
        private prefixes: CachePrefixesService,
    ) { }

    /**
     * Get data from cache
     * @param prefix - Entity/domain prefix (use CachePrefixesService properties)
     * @param identifier - Unique identifier
     * @returns Cached value or null if not found
     */
    async get<T>(prefix: string, identifier: string | number): Promise<T | null> {
        const key = this.prefixes.getKey(prefix, identifier);
        try {
            return await this.cacheManager.get<T>(key);
        } catch (error) {
            this.logger.error(`Failed to get cache item: ${key}`, error.stack);
            return null;
        }
    }

    /**
     * Set data in cache with short TTL (1 minute)
     */
    async setShort<T>(prefix: string, identifier: string | number, value: T): Promise<void> {
        await this.set(prefix, identifier, value, this.CACHE_TTL.SHORT);
    }

    /**
     * Set data in cache with medium TTL (5 minutes)
     */
    async setMedium<T>(prefix: string, identifier: string | number, value: T): Promise<void> {
        await this.set(prefix, identifier, value, this.CACHE_TTL.MEDIUM);
    }

    /**
     * Set data in cache with long TTL (1 hour)
     */
    async setLong<T>(prefix: string, identifier: string | number, value: T): Promise<void> {
        await this.set(prefix, identifier, value, this.CACHE_TTL.LONG);
    }

    /**
     * Set data in cache with very long TTL (24 hours)
     */
    async setVeryLong<T>(prefix: string, identifier: string | number, value: T): Promise<void> {
        await this.set(prefix, identifier, value, this.CACHE_TTL.VERY_LONG);
    }

    /**
     * Set data in cache with custom TTL
     */
    async set<T>(prefix: string, identifier: string | number, value: T, ttl?: number): Promise<void> {
        const key = this.prefixes.getKey(prefix, identifier);
        try {
            await this.cacheManager.set(key, value, ttl);
            this.logger.debug(`Cache set: ${key} (TTL: ${ttl}ms)`);
        } catch (error) {
            this.logger.error(`Failed to set cache item: ${key}`, error.stack);
        }
    }

    /**
     * Delete specific item from cache
     */
    async delete(prefix: string, identifier: string | number): Promise<void> {
        const key = this.prefixes.getKey(prefix, identifier);
        try {
            await this.cacheManager.del(key);
            this.logger.debug(`Cache deleted: ${key}`);
        } catch (error) {
            this.logger.error(`Failed to delete cache item: ${key}`, error.stack);
        }
    }

    /**
     * Delete all items with specific prefix
     * Note: This requires Redis client access for pattern-based deletion
     */
    async deleteByPrefix(prefix: string): Promise<void> {
        try {
            // Get the Redis store from the cache manager
            const redisStore = (this.cacheManager as any).store as RedisStore;

            if (redisStore && typeof redisStore.getClient === 'function') {
                const client = redisStore.getClient();
                if (client) {
                    // Get all keys matching pattern
                    const keys = await client.keys(`${prefix}:*`);

                    // Delete keys if any found
                    if (keys.length > 0) {
                        await client.del(keys);
                        this.logger.debug(`Deleted ${keys.length} keys with prefix: ${prefix}`);
                    }
                }
            } else {
                this.logger.warn(`Cannot delete by prefix: ${prefix} - Redis store not available`);
            }
        } catch (error) {
            this.logger.error(`Failed to delete by prefix: ${prefix}`, error.stack);
        }
    }

    /**
     * Cache a function call result
     * @param prefix - Cache prefix (use CachePrefixesService properties)
     * @param identifier - Unique identifier
     * @param fetchFn - Function to execute if cache miss
     * @param ttl - Cache TTL in milliseconds (default: 5 minutes)
     * @returns The cached or fetched value
     */
    async getOrSet<T>(
        prefix: string,
        identifier: string | number,
        fetchFn: () => Promise<T>,
        ttl: number = this.CACHE_TTL.MEDIUM
    ): Promise<T> {
        const key = this.prefixes.getKey(prefix, identifier);

        try {
            // Try to get from cache first
            const cachedValue = await this.cacheManager.get<T>(key);

            if (cachedValue !== undefined && cachedValue !== null) {
                this.logger.debug(`Cache hit: ${key}`);
                return cachedValue;
            }

            // Cache miss, execute fetch function
            this.logger.debug(`Cache miss: ${key}`);
            const fetchedValue = await fetchFn();

            // Only cache if value is not null/undefined
            if (fetchedValue !== undefined && fetchedValue !== null) {
                await this.cacheManager.set(key, fetchedValue, ttl);
                this.logger.debug(`Cached new value: ${key} (TTL: ${ttl}ms)`);
            }

            return fetchedValue;
        } catch (error) {
            this.logger.error(`Cache getOrSet failed for: ${key}`, error.stack);
            // On error, fall back to direct execution
            return fetchFn();
        }
    }
}