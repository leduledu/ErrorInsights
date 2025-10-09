import { ErrorEventService } from './error-event.service';
import { elasticsearchService } from './elasticsearch.service';
import { socketIOService } from './socketio.service';
import {
  IErrorEvent,
  IErrorEventCreate,
  IErrorEventSearchFilters,
  IErrorEventSearchResult,
  IErrorEventStats,
  IRepositoryResult,
} from '../types/error-event.types';
import {
  IElasticsearchSearchFilters
} from '../types/elasticsearch.types';
import { logger } from '../utils/logger.util';

export class ErrorEventIntegratedService {
  private mongoService: ErrorEventService;

  constructor() {
    this.mongoService = new ErrorEventService();
  }

  async initialize(): Promise<IRepositoryResult<boolean>> {
    try {

      const elasticsearchResult = await elasticsearchService.initialize();
      if (!elasticsearchResult.success) {
        logger.warn('Elasticsearch initialization failed, continuing with MongoDB only', {
          error: elasticsearchResult.error,
        });
      }

      return {
        success: true,
        data: true,
        message: 'Integrated service initialized successfully',
      };
    } catch (error) {
      logger.error('Failed to initialize integrated service', { error });
      return {
        success: false,
        error: 'Failed to initialize integrated service',
      };
    }
  }

  async createErrorEvent(data: IErrorEventCreate): Promise<IRepositoryResult<IErrorEvent>> {
    try {

      const mongoResult = await this.mongoService.createErrorEvent(data);
      
      if (!mongoResult.success || !mongoResult.data) {
        return mongoResult;
      }

      this.indexInElasticsearch(mongoResult.data).catch(error => {
        logger.error('Failed to index error event in Elasticsearch', {
          error,
          errorEventId: mongoResult.data?._id,
        });
      });

      socketIOService.broadcastNewError(mongoResult.data);

      logger.info('Error event created successfully', {
        errorEventId: mongoResult.data._id,
        userId: mongoResult.data.userId,
      });

      return mongoResult;
    } catch (error) {
      logger.error('Error in createErrorEvent integrated service', { error });
      return {
        success: false,
        error: 'Failed to create error event',
      };
    }
  }

  async searchErrorEvents(
    filters: IErrorEventSearchFilters
  ): Promise<IRepositoryResult<IErrorEventSearchResult>> {
    try {

      const elasticsearchFilters = this.convertToElasticsearchFilters(filters);
      const elasticsearchResult = await elasticsearchService.searchErrorEvents(elasticsearchFilters);
      
      if (elasticsearchResult.success && elasticsearchResult.data) {

        const result: IErrorEventSearchResult = {
          data: elasticsearchResult.data.data.map(event => ({
            _id: event.id,
            timestamp: event.timestamp,
            userId: event.userId,
            browser: event.browser,
            url: event.url,
            errorMessage: event.errorMessage,
            stackTrace: event.stackTrace,
            ...(event.createdAt && { createdAt: event.createdAt }),
            ...(event.updatedAt && { updatedAt: event.updatedAt }),
          })),
          total: elasticsearchResult.data.total,
          page: elasticsearchResult.data.page,
          pageSize: elasticsearchResult.data.pageSize,
          totalPages: elasticsearchResult.data.totalPages,
        };

        logger.debug('Elasticsearch search completed', {
          total: result.total,
          took: elasticsearchResult.took,
        });

        return {
          success: true,
          data: result,
          message: `Found ${result.total} error events`,
        };
      }


      logger.warn('Elasticsearch search failed, falling back to MongoDB', {
        error: elasticsearchResult.error,
      });

      return await this.mongoService.searchErrorEvents(filters);
    } catch (error) {
      logger.error('Error in searchErrorEvents integrated service', { error });
      return {
        success: false,
        error: 'Failed to search error events',
      };
    }
  }

  async getErrorEventStats(
    filters?: Partial<IErrorEventSearchFilters>
  ): Promise<IRepositoryResult<IErrorEventStats>> {
    try {
      const elasticsearchFilters = filters ? this.convertToElasticsearchFilters(filters) : undefined;
      const elasticsearchResult = await elasticsearchService.getErrorEventStats(elasticsearchFilters);
      
      if (!elasticsearchResult.success || !elasticsearchResult.data) {
        return {
          success: false,
          error: elasticsearchResult.error || 'Failed to retrieve error statistics from Elasticsearch',
        };
      }

      const stats: IErrorEventStats = {
        totalErrors: elasticsearchResult.data.totalErrors,
        errorsByBrowser: elasticsearchResult.data.errorsByBrowser,
        errorsByUrl: elasticsearchResult.data.errorsByUrl,
        topErrorMessages: elasticsearchResult.data.topErrorMessages,
        errorsOverTime: elasticsearchResult.data.errorsOverTime,
        uniqueUsers: elasticsearchResult.data.uniqueUsers,
        averageErrorsPerUser: elasticsearchResult.data.averageErrorsPerUser,
      };

      logger.debug('Elasticsearch stats completed', {
        totalErrors: stats.totalErrors,
        took: elasticsearchResult.took,
      });

      return {
        success: true,
        data: stats,
        message: 'Error statistics retrieved successfully',
      };
    } catch (error) {
      logger.error('Error in getErrorEventStats integrated service', { error });
      return {
        success: false,
        error: 'Failed to get error event statistics',
      };
    }
  }

  async getErrorEventById(id: string): Promise<IRepositoryResult<IErrorEvent | null>> {
    return await this.mongoService.getErrorEventById(id);
  }

  async getBrowsers(): Promise<IRepositoryResult<string[]>> {
    return await this.mongoService.getBrowsers();
  }

  async getUrls(): Promise<IRepositoryResult<string[]>> {
    return await this.mongoService.getUrls();
  }

  async getUsers(): Promise<IRepositoryResult<string[]>> {
    return await this.mongoService.getUsers();
  }

  private async indexInElasticsearch(errorEvent: IErrorEvent): Promise<void> {
    const result = await elasticsearchService.indexErrorEvent(errorEvent);
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  private convertToElasticsearchFilters(
    filters: IErrorEventSearchFilters
  ): IElasticsearchSearchFilters {
    const result: IElasticsearchSearchFilters = {};
    
    if (filters.dateRange) {
      result.dateRange = filters.dateRange;
    }
    if (filters.userId) {
      result.userId = filters.userId;
    }
    if (filters.browser) {
      result.browser = filters.browser;
    }
    if (filters.url) {
      result.url = filters.url;
    }
    if (filters.keyword) {
      result.keyword = filters.keyword;
    }
    if (filters.page) {
      result.page = filters.page;
    }
    if (filters.pageSize) {
      result.pageSize = filters.pageSize;
    }
    if (filters.sortBy) {
      result.sortBy = filters.sortBy;
    }
    if (filters.sortOrder) {
      result.sortOrder = filters.sortOrder;
    }
    
    return result;
  }
}