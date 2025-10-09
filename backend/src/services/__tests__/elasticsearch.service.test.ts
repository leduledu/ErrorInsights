jest.mock('../../utils/logger.util', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockIndicesExists = jest.fn();
const mockIndicesCreate = jest.fn();
const mockClientClose = jest.fn();

jest.mock('@elastic/elasticsearch', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      ping: jest.fn(),
      indices: {
        exists: mockIndicesExists,
        create: mockIndicesCreate,
      },
      close: mockClientClose,
    })),
  };
});

import { ElasticsearchService } from '../elasticsearch.service';
import { logger } from '../../utils/logger.util';

describe('ElasticsearchService - createIndex', () => {
  let elasticsearchService: ElasticsearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env['ELASTICSEARCH_INDEX'] = 'error-events';
    
    (ElasticsearchService as any).instance = undefined;
    
    elasticsearchService = new (ElasticsearchService as any)();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when index already exists', () => {
    it('should return success without creating the index', async () => {

      mockIndicesExists.mockResolvedValue(true);

      const result = await elasticsearchService.createIndex();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.message).toBe('Index already exists');
      expect(mockIndicesExists).toHaveBeenCalledWith({ index: 'error-events' });
      expect(mockIndicesCreate).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Elasticsearch index error-events already exists');
    });
  });

  describe('when index does not exist', () => {
    it('should create the index successfully', async () => {

      mockIndicesExists.mockResolvedValue(false);
      mockIndicesCreate.mockResolvedValue({
        acknowledged: true,
        index: 'error-events',
      } as any);
      
      const result = await elasticsearchService.createIndex();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.message).toBe('Index created successfully');
      
      expect(mockIndicesExists).toHaveBeenCalledWith({ index: 'error-events' });
      expect(mockIndicesCreate).toHaveBeenCalledWith({
        index: 'error-events',
        body: expect.objectContaining({
          mappings: expect.objectContaining({
            properties: expect.objectContaining({
              id: { type: 'keyword' },
              timestamp: { 
                type: 'date',
                format: 'strict_date_optional_time||epoch_millis'
              },
              userId: expect.objectContaining({
                type: 'keyword',
                fields: {
                  text: { type: 'text', analyzer: 'standard' }
                }
              }),
              browser: expect.objectContaining({
                type: 'keyword',
                fields: {
                  text: { type: 'text', analyzer: 'standard' }
                }
              }),
              url: expect.objectContaining({
                type: 'keyword',
                fields: {
                  text: { type: 'text', analyzer: 'standard' }
                }
              }),
              errorMessage: expect.objectContaining({
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: { type: 'completion' }
                }
              }),
              stackTrace: expect.objectContaining({
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' }
                }
              }),
              createdAt: { 
                type: 'date',
                format: 'strict_date_optional_time||epoch_millis'
              },
              updatedAt: { 
                type: 'date',
                format: 'strict_date_optional_time||epoch_millis'
              },
            })
          }),
          settings: expect.objectContaining({
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: expect.objectContaining({
              analyzer: expect.objectContaining({
                custom_text_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball'],
                },
              }),
            }),
          }),
        }),
      });
      
      expect(logger.info).toHaveBeenCalledWith('Elasticsearch index error-events created successfully');
    });

    it('should use custom index name from environment variable', async () => {

      const originalIndexName = process.env['ELASTICSEARCH_INDEX'];
      process.env['ELASTICSEARCH_INDEX'] = 'custom-error-events';
      

      (ElasticsearchService as any).instance = undefined;
      const serviceWithCustomIndex = new (ElasticsearchService as any)();
      
      mockIndicesExists.mockResolvedValue(false);
      mockIndicesCreate.mockResolvedValue({
        acknowledged: true,
        index: 'custom-error-events',
      } as any);

      const result = await serviceWithCustomIndex.createIndex();

      expect(result.success).toBe(true);
      expect(mockIndicesExists).toHaveBeenCalledWith({ index: 'custom-error-events' });
      expect(mockIndicesCreate).toHaveBeenCalledWith({
        index: 'custom-error-events',
        body: expect.any(Object),
      });

      process.env['ELASTICSEARCH_INDEX'] = originalIndexName;
    });
  });

  describe('error handling', () => {
    it('should handle index exists check failure', async () => {

      const error = new Error('Connection failed');
      mockIndicesExists.mockRejectedValue(error);

      const result = await elasticsearchService.createIndex();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Index creation failed:');
      expect(result.error).toContain('Connection failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to create Elasticsearch index', { error });
      expect(mockIndicesCreate).not.toHaveBeenCalled();
    });

    it('should handle index creation failure', async () => {

      mockIndicesExists.mockResolvedValue(false);
      const error = new Error('Index creation failed');
      mockIndicesCreate.mockRejectedValue(error);

      const result = await elasticsearchService.createIndex();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Index creation failed:');
      expect(result.error).toContain('Index creation failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to create Elasticsearch index', { error });
      expect(mockIndicesExists).toHaveBeenCalledWith({ index: 'error-events' });
      expect(mockIndicesCreate).toHaveBeenCalled();
    });

    it('should handle malformed response from index creation', async () => {

      mockIndicesExists.mockResolvedValue(false);
      mockIndicesCreate.mockResolvedValue(null as any);

      const result = await elasticsearchService.createIndex();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(result.message).toBe('Index created successfully');
      expect(logger.info).toHaveBeenCalledWith('Elasticsearch index error-events created successfully');
    });
  });

  describe('index mapping validation', () => {
    it('should create index with correct field mappings', async () => {

      mockIndicesExists.mockResolvedValue(false);
      mockIndicesCreate.mockResolvedValue({
        acknowledged: true,
        index: 'error-events',
      } as any);

      await elasticsearchService.createIndex();

      const createCall = mockIndicesCreate.mock.calls[0];
      const mapping = createCall[0].body;
      
      expect(mapping.mappings.properties).toHaveProperty('id');
      expect(mapping.mappings.properties).toHaveProperty('timestamp');
      expect(mapping.mappings.properties).toHaveProperty('userId');
      expect(mapping.mappings.properties).toHaveProperty('browser');
      expect(mapping.mappings.properties).toHaveProperty('url');
      expect(mapping.mappings.properties).toHaveProperty('errorMessage');
      expect(mapping.mappings.properties).toHaveProperty('stackTrace');
      expect(mapping.mappings.properties).toHaveProperty('createdAt');
      expect(mapping.mappings.properties).toHaveProperty('updatedAt');

      expect(mapping.mappings.properties.errorMessage.fields).toHaveProperty('keyword');
      expect(mapping.mappings.properties.errorMessage.fields).toHaveProperty('suggest');
      expect(mapping.mappings.properties.userId.fields).toHaveProperty('text');
      expect(mapping.mappings.properties.browser.fields).toHaveProperty('text');
      expect(mapping.mappings.properties.url.fields).toHaveProperty('text');
    });

    it('should create index with correct settings', async () => {

      mockIndicesExists.mockResolvedValue(false);
      mockIndicesCreate.mockResolvedValue({
        acknowledged: true,
        index: 'error-events',
      } as any);

      await elasticsearchService.createIndex();

      const createCall = mockIndicesCreate.mock.calls[0];
      const settings = createCall[0].body.settings;
      
      expect(settings.number_of_shards).toBe(1);
      expect(settings.number_of_replicas).toBe(0);
      expect(settings.analysis.analyzer.custom_text_analyzer).toEqual({
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'stop', 'snowball'],
      });
    });
  });
});