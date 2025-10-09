jest.mock('../../utils/logger.util', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockRedisService = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  invalidateByTags: jest.fn(),
};

jest.mock('../redis.service', () => ({
  redisService: mockRedisService,
}));

import { CacheStrategyService } from '../cache-strategy.service';
import { logger } from '../../utils/logger.util';

describe('CacheStrategyService - Error Event Search Methods', () => {
  let cacheStrategyService: CacheStrategyService;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheStrategyService = new CacheStrategyService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cacheErrorEventSearch', () => {
    const mockSearchParams = {
      page: 1,
      pageSize: 25,
      browser: 'Chrome',
      userId: 'user123',
      keyword: 'error',
    };

    const mockSearchResults = {
      data: [
        {
          id: '1',
          userId: 'user123',
          browser: 'Chrome',
          errorMessage: 'Test error',
          timestamp: '2023-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    };

    it('should successfully cache error event search results', async () => {

      const ttl = 300;
      mockRedisService.set.mockResolvedValue({
        success: true,
        data: true,
        message: 'Data cached successfully',
      });

      const result = await cacheStrategyService.cacheErrorEventSearch(
        mockSearchParams,
        mockSearchResults,
        ttl
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalledTimes(1);
      
      const setCall = mockRedisService.set.mock.calls[0];
      expect(setCall[0]).toMatch(/^error-events:search:/);
      expect(setCall[1]).toEqual(mockSearchResults);
      expect(setCall[2]).toEqual({
        ttl: 300,
        tags: [
          'error-events:search',
          'user:user123',
          'browser:Chrome',
          'search',
        ],
      });
    });

    it('should use default TTL when not provided', async () => {

      mockRedisService.set.mockResolvedValue({
        success: true,
        data: true,
      });
      const result = await cacheStrategyService.cacheErrorEventSearch(
        mockSearchParams,
        mockSearchResults
      );

      expect(result.success).toBe(true);
      const setCall = mockRedisService.set.mock.calls[0];
      expect(setCall[2].ttl).toBe(300);
    });

    it('should generate correct cache key with sorted parameters', async () => {

      const unsortedParams = {
        userId: 'user123',
        browser: 'Chrome',
        pageSize: 25,
        page: 1,
      };
      
      mockRedisService.set.mockResolvedValue({
        success: true,
        data: true,
      });

      await cacheStrategyService.cacheErrorEventSearch(unsortedParams, mockSearchResults);

      const setCall = mockRedisService.set.mock.calls[0];
      const expectedKey = 'error-events:search:browser:Chrome|page:1|pageSize:25|userId:user123';
      expect(setCall[0]).toBe(expectedKey);
    });

    it('should generate correct tags for different parameter combinations', async () => {

      const paramsWithDateRange = {
        ...mockSearchParams,
        dateRange: { start: '2023-01-01', end: '2023-01-31' },
      };
      
      mockRedisService.set.mockResolvedValue({
        success: true,
        data: true,
      });

      await cacheStrategyService.cacheErrorEventSearch(paramsWithDateRange, mockSearchResults);

      const setCall = mockRedisService.set.mock.calls[0];
      expect(setCall[2].tags).toEqual([
        'error-events:search',
        'user:user123',
        'browser:Chrome',
        'date-range',
        'search',
      ]);
    });

    it('should handle Redis service errors', async () => {

      mockRedisService.set.mockResolvedValue({
        success: false,
        error: 'Redis connection failed',
      });

      const result = await cacheStrategyService.cacheErrorEventSearch(
        mockSearchParams,
        mockSearchResults
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Redis connection failed');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle exceptions during caching', async () => {

      const exception = new Error('Unexpected error');
      mockRedisService.set.mockRejectedValue(exception);

      const result = await cacheStrategyService.cacheErrorEventSearch(
        mockSearchParams,
        mockSearchResults
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cache error event search failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to cache error event search',
        expect.objectContaining({
          error: exception,
          searchParams: mockSearchParams,
        })
      );
    });
  });

  describe('getCachedErrorEventSearch', () => {
    const mockSearchParams = {
      page: 1,
      pageSize: 25,
      browser: 'Firefox',
      url: 'https://example.com/test',
    };

    const mockCachedResults = {
      data: [
        {
          id: '2',
          userId: 'user456',
          browser: 'Firefox',
          url: 'https://example.com/test',
          errorMessage: 'Another test error',
          timestamp: '2023-01-02T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
      totalPages: 1,
    };

    it('should successfully retrieve cached search results', async () => {

      mockRedisService.get.mockResolvedValue({
        success: true,
        data: mockCachedResults,
        message: 'Data retrieved from cache',
      });

      const result = await cacheStrategyService.getCachedErrorEventSearch(mockSearchParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCachedResults);
      expect(mockRedisService.get).toHaveBeenCalledTimes(1);
      
      const getCall = mockRedisService.get.mock.calls[0];
      expect(getCall[0]).toMatch(/^error-events:search:/);
    });

    it('should generate consistent cache key for same parameters', async () => {

      const params1 = { browser: 'Chrome', page: 1 };
      const params2 = { page: 1, browser: 'Chrome' };
      
      mockRedisService.get.mockResolvedValue({
        success: true,
        data: mockCachedResults,
      });

      await cacheStrategyService.getCachedErrorEventSearch(params1);
      await cacheStrategyService.getCachedErrorEventSearch(params2);

      expect(mockRedisService.get).toHaveBeenCalledTimes(2);
      
      const firstCall = mockRedisService.get.mock.calls[0][0];
      const secondCall = mockRedisService.get.mock.calls[1][0];
      expect(firstCall).toBe(secondCall);
    });

    it('should handle cache miss (no data found)', async () => {

      mockRedisService.get.mockResolvedValue({
        success: true,
        data: null,
        message: 'Key not found',
      });

      const result = await cacheStrategyService.getCachedErrorEventSearch(mockSearchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle Redis service errors', async () => {

      mockRedisService.get.mockResolvedValue({
        success: false,
        error: 'Redis timeout',
      });

      const result = await cacheStrategyService.getCachedErrorEventSearch(mockSearchParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Redis timeout');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle exceptions during retrieval', async () => {

      const exception = new Error('Network error');
      mockRedisService.get.mockRejectedValue(exception);

      const result = await cacheStrategyService.getCachedErrorEventSearch(mockSearchParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Get cached error event search failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get cached error event search',
        expect.objectContaining({
          error: exception,
          searchParams: mockSearchParams,
        })
      );
    });

    it('should work with empty search parameters', async () => {

      const emptyParams = {};
      mockRedisService.get.mockResolvedValue({
        success: true,
        data: mockCachedResults,
      });

      const result = await cacheStrategyService.getCachedErrorEventSearch(emptyParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCachedResults);
      
      const getCall = mockRedisService.get.mock.calls[0];
      expect(getCall[0]).toBe('error-events:search:');
    });

    it('should handle complex search parameters', async () => {

      const complexParams = {
        page: 2,
        pageSize: 50,
        browser: 'Safari',
        userId: 'user789',
        keyword: 'javascript error',
        dateRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-12-31T23:59:59Z',
        },
        sortBy: 'timestamp',
        sortOrder: 'desc',
      };
      
      mockRedisService.get.mockResolvedValue({
        success: true,
        data: mockCachedResults,
      });

      const result = await cacheStrategyService.getCachedErrorEventSearch(complexParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCachedResults);
      
      const getCall = mockRedisService.get.mock.calls[0][0];
      expect(getCall).toContain('browser:Safari');
      expect(getCall).toContain('userId:user789');
      expect(getCall).toContain('keyword:javascript error');
    });
  });

  describe('Integration between cache and get methods', () => {
    it('should use consistent keys for cache and get operations', async () => {

      const searchParams = {
        page: 1,
        pageSize: 10,
        browser: 'Edge',
        userId: 'test-user',
      };
      
      const searchResults = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      mockRedisService.set.mockResolvedValue({
        success: true,
        data: true,
      });

      mockRedisService.get.mockResolvedValue({
        success: true,
        data: searchResults,
      });

      await cacheStrategyService.cacheErrorEventSearch(searchParams, searchResults);
      await cacheStrategyService.getCachedErrorEventSearch(searchParams);

      expect(mockRedisService.set).toHaveBeenCalledTimes(1);
      expect(mockRedisService.get).toHaveBeenCalledTimes(1);
      
      const cacheKey = mockRedisService.set.mock.calls[0][0];
      const getKey = mockRedisService.get.mock.calls[0][0];
      
      expect(cacheKey).toBe(getKey);
    });
  });
});