import { ErrorEventRepository } from '../repositories/error-event.repository';
import {
  IErrorEvent,
  IErrorEventCreate,
  IErrorEventSearchFilters,
  IErrorEventSearchResult,
  IRepositoryResult,
} from '../types/error-event.types';

export class ErrorEventService {
  private repository: ErrorEventRepository;

  constructor() {
    this.repository = new ErrorEventRepository();
  }

  async createErrorEvent(data: IErrorEventCreate): Promise<IRepositoryResult<IErrorEvent>> {
    try {

      const validationResult = this.validateErrorEventData(data);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error || 'Validation failed',
        };
      }

      const result = await this.repository.createErrorEvent(data);
      
      if (result.success) {
        console.log(`Error event created for user: ${data.userId}`);
      }

      return result;
    } catch (error) {
      console.error('Error in createErrorEvent service:', error);
      return {
        success: false,
        error: 'Failed to create error event',
      };
    }
  }

  async getErrorEventById(id: string): Promise<IRepositoryResult<IErrorEvent | null>> {
    try {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error: 'Error event ID is required',
        };
      }

      return await this.repository.findErrorEventById(id);
    } catch (error) {
      console.error('Error in getErrorEventById service:', error);
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
      return await this.repository.searchErrorEvents(filters);
    } catch (error) {
      console.error('Error in searchErrorEvents service:', error);
      return {
        success: false,
        error: 'Failed to search error events',
      };
    }
  }

  async getBrowsers(): Promise<IRepositoryResult<string[]>> {
    try {
      return await this.repository.getBrowsers();
    } catch (error) {
      console.error('Error in getBrowsers service:', error);
      return {
        success: false,
        error: 'Failed to get browsers',
      };
    }
  }

  async getUrls(): Promise<IRepositoryResult<string[]>> {
    try {
      return await this.repository.getUrls();
    } catch (error) {
      console.error('Error in getUrls service:', error);
      return {
        success: false,
        error: 'Failed to get URLs',
      };
    }
  }

  async getUsers(): Promise<IRepositoryResult<string[]>> {
    try {
      return await this.repository.getUsers();
    } catch (error) {
      console.error('Error in getUsers service:', error);
      return {
        success: false,
        error: 'Failed to get users',
      };
    }
  }

  private validateErrorEventData(data: IErrorEventCreate): { isValid: boolean; error?: string } {
    if (!data) {
      return { isValid: false, error: 'Error event data is required' };
    }

    if (!data.timestamp || !(data.timestamp instanceof Date)) {
      return { isValid: false, error: 'Valid timestamp is required' };
    }

    if (data.timestamp > new Date()) {
      return { isValid: false, error: 'Timestamp cannot be in the future' };
    }

    if (!data.userId || data.userId.trim().length === 0) {
      return { isValid: false, error: 'User ID is required' };
    }

    if (!data.browser || data.browser.trim().length === 0) {
      return { isValid: false, error: 'Browser is required' };
    }

    if (!data.url || data.url.trim().length === 0) {
      return { isValid: false, error: 'URL is required' };
    }

    try {
      new URL(data.url);
    } catch {
      return { isValid: false, error: 'Invalid URL format' };
    }

    if (!data.errorMessage || data.errorMessage.trim().length === 0) {
      return { isValid: false, error: 'Error message is required' };
    }

    if (!data.stackTrace || data.stackTrace.trim().length === 0) {
      return { isValid: false, error: 'Stack trace is required' };
    }

    return { isValid: true };
  }

}
