export { ErrorEvent, IErrorEventDocument } from '../models/error-event.model';

export { BaseRepository } from '../repositories/base.repository';
export { ErrorEventRepository } from '../repositories/error-event.repository';

export { DatabaseService, databaseService } from '../services/database.service';
export { ErrorEventService } from '../services/error-event.service';
export { ElasticsearchService, elasticsearchService } from '../services/elasticsearch.service';
export { ErrorEventIntegratedService } from '../services/error-event-integrated.service';
export { KafkaProducerService, kafkaProducerService } from '../services/kafka-producer.service';
export { KafkaConsumerService, kafkaConsumerService } from '../services/kafka-consumer.service';
export { KafkaIntegratedService, kafkaIntegratedService } from '../services/kafka-integrated.service';
export { RedisService, redisService } from '../services/redis.service';
export { CacheStrategyService, cacheStrategyService } from '../services/cache-strategy.service';
export { ErrorEventCachedService, errorEventCachedService } from '../services/error-event-cached.service';

export * from '../types/error-event.types';
export * from '../types/repository.types';
export * from '../types/elasticsearch.types';
export * from '../types/kafka.types';
export * from '../types/redis.types';

export { RepositoryError } from '../utils/repository-error.util';
export { Logger, logger } from '../utils/logger.util';

export type {
  IErrorEvent,
  IErrorEventCreate,
  IErrorEventSearchFilters,
  IErrorEventSearchResult,
  IErrorEventStats,
  IRepositoryResult
} from '../types/error-event.types';

export type {
  IPaginationOptions,
  IQueryOptions
} from '../types/repository.types';
