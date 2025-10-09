import { createClient } from 'redis';
import {
  IRedisConfig,
  IRedisCacheOptions,
  IRedisCacheItem,
  IRedisServiceResult,
  IRedisTagInvalidation,
  IRedisCacheKeyBuilder,
  IRedisSerializationOptions,
} from '../types/redis.types';
import { logger } from '../utils/logger.util';

export class RedisService {
  private static instance: RedisService;
  private client!: any;
  private subscriber!: any;
  private publisher!: any;
  private config: IRedisConfig;
  private isConnected: boolean = false;
  private keyBuilder: IRedisCacheKeyBuilder;
  private serialization: IRedisSerializationOptions;

  private constructor() {
    this.config = {
      socket: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379'),
        connectTimeout: 10000,
        keepAlive: 30000,
      },
      ...(process.env['REDIS_PASSWORD'] && { password: process.env['REDIS_PASSWORD'] }),
      database: parseInt(process.env['REDIS_DB'] || '0'),
    };

    this.keyBuilder = {
      prefix: 'error-insights',
      separator: ':',
      buildKey: (parts: string[]) => [this.keyBuilder.prefix, ...parts].join(this.keyBuilder.separator),
      parseKey: (key: string) => key.split(this.keyBuilder.separator),
    };

    this.serialization = {
      serialize: (data: any) => JSON.stringify(data),
      deserialize: (data: string) => JSON.parse(data),
    };

    this.initializeClients();
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private initializeClients(): void {
    this.client = createClient(this.config);
    this.subscriber = createClient(this.config);
    this.publisher = createClient(this.config);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error: any) => {
      logger.error('Redis client error', { error });
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });


  }

  public async initialize(): Promise<IRedisServiceResult<boolean>> {
    try {
      await this.client.connect();
      await this.subscriber.connect();
      await this.publisher.connect();

      this.subscriber.on('error', (error: any) => {
        logger.error('Redis subscriber error', { error });
      });

      this.publisher.on('error', (error: any) => {
        logger.error('Redis publisher error', { error });
      });

      logger.info('Redis service initialized successfully', {
        host: (this.config.socket as any)?.host,
        port: (this.config.socket as any)?.port,
        db: this.config.database,
      });

      return {
        success: true,
        data: true,
        message: 'Redis service initialized successfully',
      };
    } catch (error) {
      logger.error('Failed to initialize Redis service', { error });
      return {
        success: false,
        error: `Redis initialization failed: ${error}`,
      };
    }
  }

  public async get<T>(key: string, options?: IRedisCacheOptions): Promise<IRedisServiceResult<T>> {
    try {
      const connectionCheck = this.checkConnection<T>();
      if (connectionCheck) return connectionCheck;

      const cacheKey = this.buildCacheKey(key, options);
      const cachedData = await this.client.get(cacheKey);

      if (cachedData === null) {
        return {
          success: true,
          message: 'Cache miss',
          metadata: {
            key: cacheKey,
            miss: true,
          },
        };
      }

      const cacheItem: IRedisCacheItem<T> = this.serialization.deserialize(cachedData);
      

      if (this.isCacheItemExpired(cacheItem)) {
        await this.client.del(cacheKey);
        
        return {
          success: true,
          message: 'Cache item expired',
          metadata: {
            key: cacheKey,
            miss: true,
          },
        };
      }

      return {
        success: true,
        data: cacheItem.data,
        message: 'Cache hit',
        metadata: {
          key: cacheKey,
          ttl: cacheItem.ttl,
          tags: cacheItem.tags,
          hit: true,
        },
      };
    } catch (error) {
      logger.error('Failed to get data from cache', { error, key });
      return {
        success: false,
        error: `Cache get failed: ${error}`,
      };
    }
  }

  public async set<T>(
    key: string,
    data: T,
    options: IRedisCacheOptions = {}
  ): Promise<IRedisServiceResult<boolean>> {
    try {
      const connectionCheck = this.checkConnection<boolean>();
      if (connectionCheck) return connectionCheck;

      const cacheKey = this.buildCacheKey(key, options);
      const ttl = options.ttl || 300;
      const tags = options.tags || [];

      const cacheItem: IRedisCacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        tags,
        key: cacheKey,
      };

      const serializedData = this.serialization.serialize(cacheItem);
      await this.client.setEx(cacheKey, ttl, serializedData);


      if (tags.length > 0) {
        await this.storeKeyTagRelations(cacheKey, tags);
      }

      return {
        success: true,
        data: true,
        message: 'Data cached successfully',
        metadata: {
          key: cacheKey,
          ttl,
          tags,
        },
      };
    } catch (error) {
      logger.error('Failed to set data in cache', { error, key });
      return {
        success: false,
        error: `Cache set failed: ${error}`,
      };
    }
  }

  public async del(key: string, options?: IRedisCacheOptions): Promise<IRedisServiceResult<boolean>> {
    try {
      const connectionCheck = this.checkConnection<boolean>();
      if (connectionCheck) return connectionCheck;

      const cacheKey = this.buildCacheKey(key, options);
      const result = await this.client.del(cacheKey);

      await this.cleanupKeyTagRelations(cacheKey);

      return {
        success: true,
        data: result > 0,
        message: result > 0 ? 'Key deleted successfully' : 'Key not found',
        metadata: {
          key: cacheKey,
        },
      };
    } catch (error) {
      logger.error('Failed to delete data from cache', { error, key });
      return {
        success: false,
        error: `Cache delete failed: ${error}`,
      };
    }
  }

  public async invalidateByTags(tags: string[]): Promise<IRedisServiceResult<IRedisTagInvalidation>> {
    try {
      const connectionCheck = this.checkConnection<IRedisTagInvalidation>();
      if (connectionCheck) return connectionCheck;

      const affectedKeys: string[] = [];
      let invalidatedCount = 0;

      for (const tag of tags) {
        const tagKey = this.buildTagKey(tag);
        const keys = await this.client.sMembers(tagKey);

        if (keys.length > 0) {
          const deleteResult = await this.client.del(keys);
          invalidatedCount += deleteResult;


          await this.client.del(tagKey);
          affectedKeys.push(...keys);
        }
      }
      await this.publishInvalidationEvent(tags, affectedKeys);

      return {
        success: true,
        data: {
          tags,
          affectedKeys,
          invalidatedCount,
        },
        message: `Invalidated ${invalidatedCount} keys for tags: ${tags.join(', ')}`,
      };
    } catch (error) {
      logger.error('Failed to invalidate cache by tags', { error, tags });
      return {
        success: false,
        error: `Cache invalidation failed: ${error}`,
      };
    }
  }

  public async disconnect(): Promise<IRedisServiceResult<boolean>> {
    try {
      await Promise.all([
        this.client.disconnect(),
        this.subscriber.disconnect(),
        this.publisher.disconnect(),
      ]);

      this.isConnected = false;
      logger.info('Redis service disconnected');

      return {
        success: true,
        data: true,
        message: 'Redis service disconnected successfully',
      };
    } catch (error) {
      logger.error('Failed to disconnect Redis service', { error });
      return {
        success: false,
        error: `Disconnection failed: ${error}`,
      };
    }
  }

  private checkConnection<T>(): IRedisServiceResult<T> | null {
    if (!this.isConnected) {
      return {
        success: false,
        error: 'Redis is not connected',
      };
    }
    return null;
  }

  private buildCacheKey(key: string, options?: IRedisCacheOptions): string {
    if (options?.key) {
      return this.keyBuilder.buildKey([options.key]);
    }
    return this.keyBuilder.buildKey(['cache', key]);
  }

  private buildTagKey(tag: string): string {
    return this.keyBuilder.buildKey(['tags', tag]);
  }

  private isCacheItemExpired(item: IRedisCacheItem): boolean {
    const now = Date.now();
    const expirationTime = item.timestamp + (item.ttl * 1000);
    return now > expirationTime;
  }

  private async storeKeyTagRelations(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = this.buildTagKey(tag);
        await this.client.sAdd(tagKey, key);
    }
  }

  private async cleanupKeyTagRelations(key: string): Promise<void> {
    logger.debug('Key-tag relationship cleanup skipped for performance', { key });
  }

  private async publishInvalidationEvent(tags: string[], keys: string[]): Promise<void> {
    const message = JSON.stringify({
      type: 'invalidation',
      tags,
      keys,
      timestamp: Date.now(),
    });

    await this.publisher.publish('cache:invalidate', message);
  }
}

export const redisService = RedisService.getInstance();