import { redisService } from './redis.service';
import {
  IRedisCacheOptions,
  IRedisServiceResult,
  IRedisTagInvalidation,
} from '../types/redis.types';
import { logger } from '../utils/logger.util';

export interface ICacheStrategy {
  get<T>(key: string, options?: IRedisCacheOptions): Promise<IRedisServiceResult<T>>;
  set<T>(key: string, data: T, options?: IRedisCacheOptions): Promise<IRedisServiceResult<boolean>>;
  invalidate(key: string, options?: IRedisCacheOptions): Promise<IRedisServiceResult<boolean>>;
  invalidateByTags(tags: string[]): Promise<IRedisServiceResult<IRedisTagInvalidation>>;
}

export interface ICacheKeyGenerator {
  generateKey(prefix: string, params: Record<string, any>): string;
  generateTags(operation: string, params: Record<string, any>): string[];
}

export class CacheStrategyService implements ICacheStrategy {
  private keyGenerator: ICacheKeyGenerator;

  constructor() {
    this.keyGenerator = {
      generateKey: (prefix: string, params: Record<string, any>): string => {
        const sortedParams = Object.keys(params)
          .sort()
          .map(key => `${key}:${params[key]}`)
          .join('|');
        return `${prefix}:${sortedParams}`;
      },
      generateTags: (operation: string, params: Record<string, any>): string[] => {
        const tags = [operation];
        

        if (params['userId']) tags.push(`user:${params['userId']}`);
        if (params['browser']) tags.push(`browser:${params['browser']}`);
        if (params['dateRange']) tags.push('date-range');
        if (params['keyword']) tags.push('search');
        
        return tags;
      },
    };
  }

  async get<T>(key: string, options?: IRedisCacheOptions): Promise<IRedisServiceResult<T>> {
    return await redisService.get<T>(key, options);
  }

  async set<T>(
    key: string,
    data: T,
    options?: IRedisCacheOptions
  ): Promise<IRedisServiceResult<boolean>> {
    return await redisService.set<T>(key, data, options);
  }

  async invalidate(key: string, options?: IRedisCacheOptions): Promise<IRedisServiceResult<boolean>> {
    return await redisService.del(key, options);
  }

  async invalidateByTags(tags: string[]): Promise<IRedisServiceResult<IRedisTagInvalidation>> {
    return await redisService.invalidateByTags(tags);
  }

  async cacheErrorEventSearch(
    searchParams: Record<string, any>,
    results: any,
    ttl: number = 300
  ): Promise<IRedisServiceResult<boolean>> {
    try {
      const key = this.keyGenerator.generateKey('error-events:search', searchParams);
      const tags = this.keyGenerator.generateTags('error-events:search', searchParams);

      return await this.set(key, results, { ttl, tags });
    } catch (error) {
      logger.error('Failed to cache error event search', { error, searchParams });
      return {
        success: false,
        error: `Cache error event search failed: ${error}`,
      };
    }
  }

  async getCachedErrorEventSearch(
    searchParams: Record<string, any>
  ): Promise<IRedisServiceResult<any>> {
    try {
      const key = this.keyGenerator.generateKey('error-events:search', searchParams);
      return await this.get(key);
    } catch (error) {
      logger.error('Failed to get cached error event search', { error, searchParams });
      return {
        success: false,
        error: `Get cached error event search failed: ${error}`,
      };
    }
  }

  async cacheErrorEventStats(
    filterParams: Record<string, any>,
    stats: any,
    ttl: number = 600
  ): Promise<IRedisServiceResult<boolean>> {
    try {
      const key = this.keyGenerator.generateKey('error-events:stats', filterParams);
      const tags = this.keyGenerator.generateTags('error-events:stats', filterParams);

      return await this.set(key, stats, { ttl, tags });
    } catch (error) {
      logger.error('Failed to cache error event stats', { error, filterParams });
      return {
        success: false,
        error: `Cache error event stats failed: ${error}`,
      };
    }
  }

  async getCachedErrorEventStats(
    filterParams: Record<string, any>
  ): Promise<IRedisServiceResult<any>> {
    try {
      const key = this.keyGenerator.generateKey('error-events:stats', filterParams);
      return await this.get(key);
    } catch (error) {
      logger.error('Failed to get cached error event stats', { error, filterParams });
      return {
        success: false,
        error: `Get cached error event stats failed: ${error}`,
      };
    }
  }

  async cacheBrowsersList(browsers: string[], ttl: number = 1800): Promise<IRedisServiceResult<boolean>> {
    try {
      const key = 'error-events:browsers';
      const tags = ['browsers', 'metadata'];

      return await this.set(key, browsers, { ttl, tags });
    } catch (error) {
      logger.error('Failed to cache browsers list', { error });
      return {
        success: false,
        error: `Cache browsers list failed: ${error}`,
      };
    }
  }

  async getCachedBrowsersList(): Promise<IRedisServiceResult<string[]>> {
    try {
      const key = 'error-events:browsers';
      return await this.get<string[]>(key);
    } catch (error) {
      logger.error('Failed to get cached browsers list', { error });
      return {
        success: false,
        error: `Get cached browsers list failed: ${error}`,
      };
    }
  }

  async cacheUrlsList(urls: string[], ttl: number = 1800): Promise<IRedisServiceResult<boolean>> {
    try {
      const key = 'error-events:urls';
      const tags = ['urls', 'metadata'];

      return await this.set(key, urls, { ttl, tags });
    } catch (error) {
      logger.error('Failed to cache URLs list', { error });
      return {
        success: false,
        error: `Cache URLs list failed: ${error}`,
      };
    }
  }

  async getCachedUrlsList(): Promise<IRedisServiceResult<string[]>> {
    try {
      const key = 'error-events:urls';
      return await this.get<string[]>(key);
    } catch (error) {
      logger.error('Failed to get cached URLs list', { error });
      return {
        success: false,
        error: `Get cached URLs list failed: ${error}`,
      };
    }
  }

  async cacheUsersList(users: string[], ttl: number = 1800): Promise<IRedisServiceResult<boolean>> {
    try {
      const key = 'error-events:users';
      const tags = ['users', 'metadata'];

      return await this.set(key, users, { ttl, tags });
    } catch (error) {
      logger.error('Failed to cache users list', { error });
      return {
        success: false,
        error: `Cache users list failed: ${error}`,
      };
    }
  }

  async getCachedUsersList(): Promise<IRedisServiceResult<string[]>> {
    try {
      const key = 'error-events:users';
      return await this.get<string[]>(key);
    } catch (error) {
      logger.error('Failed to get cached users list', { error });
      return {
        success: false,
        error: `Get cached users list failed: ${error}`,
      };
    }
  }

  async invalidateAllErrorEventCaches(): Promise<IRedisServiceResult<IRedisTagInvalidation>> {
    try {
      const tags = [
        'error-events:search',
        'error-events:stats',
        'browsers',
        'urls',
        'users',
        'metadata',
      ];

      return await this.invalidateByTags(tags);
    } catch (error) {
      logger.error('Failed to invalidate all error event caches', { error });
      return {
        success: false,
        error: `Invalidate all error event caches failed: ${error}`,
      };
    }
  }

  async invalidateUserCaches(userId: string): Promise<IRedisServiceResult<IRedisTagInvalidation>> {
    try {
      const tags = [`user:${userId}`];
      return await this.invalidateByTags(tags);
    } catch (error) {
      logger.error('Failed to invalidate user caches', { error, userId });
      return {
        success: false,
        error: `Invalidate user caches failed: ${error}`,
      };
    }
  }

  async invalidateBrowserCaches(browser: string): Promise<IRedisServiceResult<IRedisTagInvalidation>> {
    try {
      const tags = [`browser:${browser}`];
      return await this.invalidateByTags(tags);
    } catch (error) {
      logger.error('Failed to invalidate browser caches', { error, browser });
      return {
        success: false,
        error: `Invalidate browser caches failed: ${error}`,
      };
    }
  }

  async invalidateSearchCaches(): Promise<IRedisServiceResult<IRedisTagInvalidation>> {
    try {
      const tags = ['search', 'error-events:search'];
      return await this.invalidateByTags(tags);
    } catch (error) {
      logger.error('Failed to invalidate search caches', { error });
      return {
        success: false,
        error: `Invalidate search caches failed: ${error}`,
      };
    }
  }

  async invalidateStatsCaches(): Promise<IRedisServiceResult<IRedisTagInvalidation>> {
    try {
      const tags = ['error-events:stats', 'date-range'];
      return await this.invalidateByTags(tags);
    } catch (error) {
      logger.error('Failed to invalidate stats caches', { error });
      return {
        success: false,
        error: `Invalidate stats caches failed: ${error}`,
      };
    }
  }
}

export const cacheStrategyService = new CacheStrategyService();
