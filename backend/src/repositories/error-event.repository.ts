import { BaseRepository } from './base.repository';
import { ErrorEvent, IErrorEventDocument } from '../models/error-event.model';
import {
  IErrorEvent,
  IErrorEventCreate,
  IErrorEventSearchFilters,
  IErrorEventSearchResult,
  IRepositoryResult,
} from '../types/error-event.types';
import { IPaginationOptions } from '../types/repository.types';

export class ErrorEventRepository extends BaseRepository<IErrorEventDocument> {
  constructor() {
    super(ErrorEvent);
  }

  async createErrorEvent(data: IErrorEventCreate): Promise<IRepositoryResult<IErrorEvent>> {
    try {
      const result = await this.create(data);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to create error event',
        };
      }

      return {
        success: true,
        data: (result.data as any).toSafeObject(),
        message: 'Error event created successfully',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create error event');
    }
  }

  async findErrorEventById(id: string): Promise<IRepositoryResult<IErrorEvent | null>> {
    try {
      const result = await this.findById(id);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to find error event',
        };
      }

      return {
        success: true,
        data: result.data ? (result.data as any).toSafeObject() : null,
        message: result.message || 'Error event found',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to find error event by ID');
    }
  }

  async searchErrorEvents(
    filters: IErrorEventSearchFilters
  ): Promise<IRepositoryResult<IErrorEventSearchResult>> {
    try {
      const query: any = {};

      if (filters.dateRange) {
        query.timestamp = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end,
        };
      }

      if (filters.userId) {
        query.userId = filters.userId;
      }

      if (filters.browser) {
        query.browser = filters.browser;
      }

      if (filters.url) {
        query.url = { $regex: filters.url, $options: 'i' };
      }

      if (filters.keyword) {
        query.$text = { $search: filters.keyword };
      }

      const paginationOptions: IPaginationOptions = {
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
        sortBy: filters.sortBy || 'timestamp',
        sortOrder: filters.sortOrder || 'desc',
      };

      const result = await this.paginate(query, paginationOptions);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to search error events',
        };
      }

      const searchResult: IErrorEventSearchResult = {
        data: result.data.data.map(doc => (doc as any).toSafeObject()),
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.pageSize,
        totalPages: result.data.totalPages,
      };

      return {
        success: true,
        data: searchResult,
        message: `Found ${searchResult.total} error events`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to search error events');
    }
  }

  async getBrowsers(): Promise<IRepositoryResult<string[]>> {
    try {
      const browsers = await this.model.distinct('browser');
      
      return {
        success: true,
        data: browsers.sort(),
        message: `Found ${browsers.length} unique browsers`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get browsers');
    }
  }

  async getUrls(): Promise<IRepositoryResult<string[]>> {
    try {
      const urls = await this.model.distinct('url');
      
      return {
        success: true,
        data: urls.sort(),
        message: `Found ${urls.length} unique URLs`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get URLs');
    }
  }

  async getUsers(): Promise<IRepositoryResult<string[]>> {
    try {
      const users = await this.model.distinct('userId');
      
      return {
        success: true,
        data: users.sort(),
        message: `Found ${users.length} unique users`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get users');
    }
  }
}
