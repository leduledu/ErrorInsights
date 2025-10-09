import { Request, Response, NextFunction } from 'express';
import { errorEventCachedService } from '../services/error-event-cached.service';
import { mockErrorService } from '../services/mock-error.service';
import { IErrorEventSearchFilters } from '../types/error-event.types';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger.util';

export class EventsController {

  // GET /events/search
  public static searchErrorEvents = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        page = '1',
        pageSize = '20',
        sortBy = 'timestamp',
        sortOrder = 'desc',        
        startDate,
        endDate,
        userId,
        browser,
        url,
        keyword
      } = req.query;

      const searchFilters: IErrorEventSearchFilters = {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      if (startDate || endDate) {
        searchFilters.dateRange = {
          start: startDate ? new Date(startDate as string) : new Date(0),
          end: endDate ? new Date(endDate as string) : new Date(),
        };
      }

      if (userId) searchFilters.userId = userId as string;
      if (browser) searchFilters.browser = browser as string;
      if (url) searchFilters.url = url as string;
      if (keyword) searchFilters.keyword = keyword as string;

      logger.info('Searching error events', {
        filters: searchFilters,
        requestId: req.headers['x-request-id'],
      });

      const result = await errorEventCachedService.searchErrorEvents(searchFilters);

      if (!result.success) {
        throw new AppError(result.error || 'Failed to search error events', 500);
      }

      logger.info('Error events search completed', {
        total: result.data?.total,
        page: searchFilters.page,
        pageSize: searchFilters.pageSize,
        requestId: req.headers['x-request-id'],
      });

      res.json({
        success: true,
        data: result.data,
        message: 'Error events retrieved successfully',
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
          filters: searchFilters,
        },
      });
    } catch (error) {
      logger.error('Error in searchErrorEvents controller', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        requestId: req.headers['x-request-id'],
      });
      next(error);
    }
  });

  // GET /events/stats
  public static getErrorEventStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        startDate,
        endDate,
        userId,
        browser,
        url
      } = req.query;

      const filters: any = {};
      
      if (startDate || endDate) {
        filters.dateRange = {
          start: startDate ? new Date(startDate as string) : undefined,
          end: endDate ? new Date(endDate as string) : undefined,
        };
      }
      
      if (userId) filters.userId = userId as string;
      if (browser) filters.browser = browser as string;
      if (url) filters.url = url as string;

      logger.info('Getting error event statistics', {
        filters,
        requestId: req.headers['x-request-id'],
      });

      const result = await errorEventCachedService.getErrorEventStats(filters);

      if (!result.success) {
        throw new AppError(result.error || 'Failed to get error event statistics', 500);
      }

      logger.info('Error event statistics retrieved', {
        totalErrors: result.data?.totalErrors,
        requestId: req.headers['x-request-id'],
      });

      res.json({
        success: true,
        data: result.data,
        message: 'Error event statistics retrieved successfully',
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
          filters,
        },
      });
    } catch (error) {
      logger.error('Error in getErrorEventStats controller', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        requestId: req.headers['x-request-id'],
      });
      next(error);
    }
  });

  // GET /events/browsers
  public static getBrowsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Getting browsers list', {
        requestId: req.headers['x-request-id'],
      });

      const result = await errorEventCachedService.getBrowsers();

      if (!result.success) {
        throw new AppError(result.error || 'Failed to get browsers list', 500);
      }

      logger.info('Browsers list retrieved', {
        count: result.data?.length,
        requestId: req.headers['x-request-id'],
      });

      res.json({
        success: true,
        data: result.data,
        message: 'Browsers list retrieved successfully',
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error in getBrowsers controller', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        requestId: req.headers['x-request-id'],
      });
      next(error);
    }
  });

  // GET /events/urls
  public static getUrls = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Getting URLs list', {
        requestId: req.headers['x-request-id'],
      });

      const result = await errorEventCachedService.getUrls();

      if (!result.success) {
        throw new AppError(result.error || 'Failed to get URLs list', 500);
      }

      logger.info('URLs list retrieved', {
        count: result.data?.length,
        requestId: req.headers['x-request-id'],
      });

      res.json({
        success: true,
        data: result.data,
        message: 'URLs list retrieved successfully',
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error in getUrls controller', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        requestId: req.headers['x-request-id'],
      });
      next(error);
    }
  });

  // GET /events/users
  public static getUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Getting users list', {
        requestId: req.headers['x-request-id'],
      });

      const result = await errorEventCachedService.getUsers();

      if (!result.success) {
        throw new AppError(result.error || 'Failed to get users list', 500);
      }

      logger.info('Users list retrieved', {
        count: result.data?.length,
        requestId: req.headers['x-request-id'],
      });

      res.json({
        success: true,
        data: result.data,
        message: 'Users list retrieved successfully',
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error in getUsers controller', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        requestId: req.headers['x-request-id'],
      });
      next(error);
    }
  });

  //GET /events/:id
  public static getErrorEventById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('Error event ID is required', 400);
      }

      logger.info('Getting error event by ID', {
        id,
        requestId: req.headers['x-request-id'],
      });

      const result = await errorEventCachedService.getErrorEventById(id);

      if (!result.success) {
        if (result.error?.includes('not found')) {
          throw new AppError('Error event not found', 404);
        }
        throw new AppError(result.error || 'Failed to get error event', 500);
      }

      if (!result.data) {
        throw new AppError('Error event not found', 404);
      }

      logger.info('Error event retrieved by ID', {
        id,
        requestId: req.headers['x-request-id'],
      });

      res.json({
        success: true,
        data: result.data,
        message: 'Error event retrieved successfully',
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error in getErrorEventById controller', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        id: req.params['id'],
        requestId: req.headers['x-request-id'],
      });
      next(error);
    }
  });

  // GET /events/mock/start 
  public static startMockErrors = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { intervalMs, errorCount } = req.query;

      const parsedIntervalMs = intervalMs ? parseInt(intervalMs as string) : undefined;
      const parsedErrorCount = errorCount ? parseInt(errorCount as string) : undefined;

      if (parsedIntervalMs !== undefined && (isNaN(parsedIntervalMs) || parsedIntervalMs < 10)) {
        throw new AppError('Interval must be at least 10ms', 400);
      }

      if (parsedErrorCount !== undefined && (isNaN(parsedErrorCount) || parsedErrorCount < 1)) {
        throw new AppError('Error count must be at least 1', 400);
      }

      if (mockErrorService.isGenerating()) {
        throw new AppError('Mock error generation is already running', 409);
      }

      logger.info('Starting mock error generation via API', {
        intervalMs: parsedIntervalMs,
        errorCount: parsedErrorCount,
        requestId: req.headers['x-request-id'],
      });
        
      mockErrorService.startGeneratingErrors(parsedIntervalMs, parsedErrorCount);

      const config = mockErrorService.getConfig();

      res.json({
        success: true,
        data: {
          status: 'started',
          config: {
            intervalMs: config.intervalMs,
            errorCount: config.errorCount,
          },
          message: 'Mock error generation started successfully',
        },
        meta: {
          requestId: req.headers['x-request-id'],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error in startMockErrors controller', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        requestId: req.headers['x-request-id'],
      });
      next(error);
    }
  });
}
