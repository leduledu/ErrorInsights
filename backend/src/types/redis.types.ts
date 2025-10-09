import { RedisClientOptions } from 'redis';

export type IRedisConfig = RedisClientOptions;

export interface IRedisCacheOptions {
  ttl?: number;
  tags?: string[];
  key?: string;
  serialize?: boolean;
  compress?: boolean;
}

export interface IRedisCacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  key: string;
  compressed?: boolean;
}

export interface IRedisServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    key?: string;
    ttl?: number;
    tags?: string[];
    hit?: boolean;
    miss?: boolean;
  };
}

export interface IRedisTagInvalidation {
  tags: string[];
  affectedKeys: string[];
  invalidatedCount: number;
}

export interface IRedisCacheKeyBuilder {
  prefix: string;
  separator: string;
  buildKey(parts: string[]): string;
  parseKey(key: string): string[];
}

export interface IRedisSerializationOptions {
  serialize: (data: any) => string;
  deserialize: (data: string) => any;
  compression?: {
    compress: (data: string) => Buffer;
    decompress: (data: Buffer) => string;
  };
}