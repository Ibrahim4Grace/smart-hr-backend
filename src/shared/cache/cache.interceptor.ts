import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';
import { CACHE_KEY_METADATA } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    constructor(
        private readonly cacheService: CacheService,
        private readonly reflector: Reflector,
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const cacheOptions = this.reflector.get(CACHE_KEY_METADATA, context.getHandler());

        if (!cacheOptions) {
            return next.handle();
        }

        const args = context.getArgs();
        const cacheKey = this.generateCacheKey(cacheOptions, args);

        // Try to get from cache first
        const cachedValue = await this.cacheService.get(cacheOptions.prefix, cacheKey);

        if (cachedValue !== null && cachedValue !== undefined) {
            return of(cachedValue);
        }

        // Cache miss, execute the method and cache the result
        return next.handle().pipe(
            tap(async (result) => {
                if (result !== null && result !== undefined) {
                    await this.cacheService.set(
                        cacheOptions.prefix,
                        cacheKey,
                        result,
                        cacheOptions.ttl
                    );
                }
            })
        );
    }

    private generateCacheKey(options: any, args: any[]): string {
        if (typeof options.key === 'function') {
            return options.key(args);
        }

        if (typeof options.key === 'string') {
            return options.key;
        }

        // Default: use first argument as key
        return args[0]?.toString() || 'default';
    }
} 