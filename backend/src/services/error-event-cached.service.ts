import { ErrorEventIntegratedService } from './error-event-integrated.service';
import { cacheStrategyService } from './cache-strategy.service';
import {
  IErrorEvent,
  IErrorEventCreate,
  IErrorEventSearchFilters,
  IErrorEventSearchResult,
  IErrorEventStats,
  IRepositoryResult,
} from '../types/error-event.types';
import { logger } from '../utils/logger.util';

export class ErrorEventCachedService {
  private dataService: ErrorEventIntegratedService;

  constructor() {
    this.dataService = new ErrorEventIntegratedService();
  }

  async initialize(): Promise<IRepositoryResult<boolean>> {
    try {
      const result = await this.dataService.initialize();
      
      if (result.success) {
        logger.info('Error event cached service initialized successfully');
      }

      return result;
    } catch (error) {
      logger.error('Failed to initialize error event cached service', { error });
      return {
        success: false,
        error: 'Failed to initialize cached service',
      };
    }
  }

  async createErrorEvent(data: IErrorEventCreate): Promise<IRepositoryResult<IErrorEvent>> {
    try {
      const result = await this.dataService.createErrorEvent(data);
      
      if (result.success && result.data) {

        await this.invalidateCachesAfterCreate(result.data);
        
        logger.info('Error event created and caches invalidated', {
          errorEventId: result.data._id,
          userId: result.data.userId,
        });
      }

      return result;
    } catch (error) {
      logger.error('Error in createErrorEvent cached service', { error });
      return {
        success: false,
        error: 'Failed to create error event',
      };
    }
  }

  async getErrorEventById(id: string): Promise<IRepositoryResult<IErrorEvent | null>> {
    try {
      const cacheKey = `error-event:${id}`;
      
      const cacheResult = await cacheStrategyService.get<IErrorEvent>(cacheKey);
      
      if (cacheResult.success && cacheResult.data) {
        logger.debug('Error event retrieved from cache', { id });
        return {
          success: true,
          data: cacheResult.data,
          message: 'Error event retrieved from cache',
        };
      }

      const result = await this.dataService.getErrorEventById(id);
      
      if (result.success && result.data) {
        await cacheStrategyService.set(cacheKey, result.data, { ttl: 600 });
        logger.debug('Error event cached after database retrieval', { id });
      }

      return result;
    } catch (error) {
      logger.error('Error in getErrorEventById cached service', { error });
      return {
        success: false,
        error: 'Failed to get error event',
      };
    }
  }

  async searchErrorEvents(
    filters: IErrorEventSearchFilters
  ): Promise<IRepositoryResult<IErrorEventSearchResult>> {
    try {
      const cacheResult = await cacheStrategyService.getCachedErrorEventSearch(filters);
      
      if (cacheResult.success && cacheResult.data) {
        logger.debug('Error event search retrieved from cache', { 
          total: cacheResult.data.total,
          filters 
        });
        return {
          success: true,
          data: cacheResult.data,
          message: 'Search results retrieved from cache',
        };
      }


      const result = await this.dataService.searchErrorEvents(filters);
      
      if (result.success && result.data) {

        const ttl = 600;
        await cacheStrategyService.cacheErrorEventSearch(filters, result.data, ttl);
        logger.debug('Error event search cached after database retrieval', { 
          total: result.data.total,
          ttl 
        });
      }

      return result;
    } catch (error) {
      logger.error('Error in searchErrorEvents cached service', { error });
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
      const cacheResult = await cacheStrategyService.getCachedErrorEventStats(filters || {});
      
      if (cacheResult.success && cacheResult.data) {
        logger.debug('Error event stats retrieved from cache', { filters });
        return {
          success: true,
          data: cacheResult.data,
          message: 'Statistics retrieved from cache',
        };
      }

      const result = await this.dataService.getErrorEventStats(filters);
      
      if (result.success && result.data) {

        const ttl = 600;
        await cacheStrategyService.cacheErrorEventStats(filters || {}, result.data, ttl);
        logger.debug('Error event stats cached after database retrieval', { ttl });
      }

      return result;
    } catch (error) {
      logger.error('Error in getErrorEventStats cached service', { error });
      return {
        success: false,
        error: 'Failed to get error event statistics',
      };
    }
  }

  async getBrowsers(): Promise<IRepositoryResult<string[]>> {
    try {
      const cacheResult = await cacheStrategyService.getCachedBrowsersList();
      
      if (cacheResult.success && cacheResult.data) {
        return {
          success: true,
          data: cacheResult.data,
          message: 'Browsers retrieved from cache',
        };
      }

      const result = await this.dataService.getBrowsers();
      
      if (result.success && result.data) {
        await cacheStrategyService.cacheBrowsersList(result.data, 1800);
        logger.debug('Browsers list cached after database retrieval');
      }

      return result;
    } catch (error) {
      logger.error('Error in getBrowsers cached service', { error });
      return {
        success: false,
        error: 'Failed to get browsers',
      };
    }
  }

  async getUrls(): Promise<IRepositoryResult<string[]>> {
    try {
      const cacheResult = await cacheStrategyService.getCachedUrlsList();
      
      if (cacheResult.success && cacheResult.data) {
        logger.debug('URLs list retrieved from cache');
        return {
          success: true,
          data: cacheResult.data,
          message: 'Failed to get browsers',
        };
      }
      const result = await this.dataService.getUrls();
      
      if (result.success && result.data) {
        await cacheStrategyService.cacheUrlsList(result.data, 1800);
        logger.debug('URLs list cached after database retrieval');
      }
      return result;
    } catch (error) {
      logger.error('Error in getUrls cached service', { error });
      return {
        success: false,
        error: 'Failed to get URLs',
      };
    }
  }

  async getUsers(): Promise<IRepositoryResult<string[]>> {
    try {
      const cacheResult = await cacheStrategyService.getCachedUsersList();
      
      if (cacheResult.success && cacheResult.data) {
        logger.debug('Users list retrieved from cache');
        return {
          success: true,
          data: cacheResult.data,
          message: 'Users retrieved from cache',
        };
      }
      const result = await this.dataService.getUsers();
      
      if (result.success && result.data) {
        await cacheStrategyService.cacheUsersList(result.data, 1800);
        logger.debug('Users list cached after database retrieval');
      }
      return result;
    } catch (error) {
      logger.error('Error in getUsers cached service', { error });
      return {
        success: false,
        error: 'Failed to get users',
      };
    }
  }

  private async invalidateCachesAfterCreate(errorEvent: IErrorEvent): Promise<void> {
    try {
      await cacheStrategyService.invalidateUserCaches(errorEvent.userId);
      
      await cacheStrategyService.invalidateBrowserCaches(errorEvent.browser);
      
      await Promise.all([
        cacheStrategyService.invalidateSearchCaches(),
        cacheStrategyService.invalidateStatsCaches(),
      ]);
      
      logger.debug('Caches invalidated after error event creation', {
        userId: errorEvent.userId,
        browser: errorEvent.browser,
      });
    } catch (error) {
      logger.error('Failed to invalidate caches after create', { error });
    }
  }
}

export const errorEventCachedService = new ErrorEventCachedService();