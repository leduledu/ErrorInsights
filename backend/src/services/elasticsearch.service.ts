import { Client } from '@elastic/elasticsearch';
import {
  IElasticsearchConfig,
  IElasticsearchErrorEvent,
  IElasticsearchSearchQuery,
  IElasticsearchSearchFilters,
  IElasticsearchSearchResult,
  IElasticsearchStats,
  IElasticsearchServiceResult,
} from '../types/elasticsearch.types';
import { IErrorEvent } from '../types/error-event.types';
import { logger } from '../utils/logger.util';

export class ElasticsearchService {
  private static instance: ElasticsearchService;
  private client: Client;
  private config: IElasticsearchConfig;
  private readonly indexName: string;
  private readonly indexMapping: any;

  private constructor() {
    this.indexName = process.env['ELASTICSEARCH_INDEX'] || 'error-events';
    this.config = {
      node: process.env['ELASTICSEARCH_NODE'] || 'http://localhost:9200',
      ...(process.env['ELASTICSEARCH_USERNAME'] && process.env['ELASTICSEARCH_PASSWORD'] && {
        auth: {
          username: process.env['ELASTICSEARCH_USERNAME'],
          password: process.env['ELASTICSEARCH_PASSWORD'],
        }
      }),
      maxRetries: 3,
      requestTimeout: 30000,
    };

    this.client = new Client(this.config);
    this.indexMapping = this.createIndexMapping();
  }

  public static getInstance(): ElasticsearchService {
    if (!ElasticsearchService.instance) {
      ElasticsearchService.instance = new ElasticsearchService();
    }
    return ElasticsearchService.instance;
  }

  public async initialize(): Promise<IElasticsearchServiceResult<boolean>> {
    try {

      await this.client.ping();
      logger.info('Elasticsearch connection established');

      await this.createIndex();
      
      return {
        success: true,
        data: true,
        message: 'Elasticsearch initialized successfully',
      };
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch', { error });
      return {
        success: false,
        error: `Elasticsearch initialization failed: ${error}`,
      };
    }
  }

  public async createIndex(): Promise<IElasticsearchServiceResult<boolean>> {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      
      if (exists) {
        logger.info(`Elasticsearch index ${this.indexName} already exists`);
        return {
          success: true,
          data: true,
          message: 'Index already exists',
        };
      }

      await this.client.indices.create({
        index: this.indexName,
        body: this.indexMapping,
      });

      logger.info(`Elasticsearch index ${this.indexName} created successfully`);
      
      return {
        success: true,
        data: true,
        message: 'Index created successfully',
      };
    } catch (error) {
      logger.error('Failed to create Elasticsearch index', { error });
      return {
        success: false,
        error: `Index creation failed: ${error}`,
      };
    }
  }

  public async indexErrorEvent(
    errorEvent: IErrorEvent
  ): Promise<IElasticsearchServiceResult<boolean>> {
    try {
      const elasticsearchEvent = this.transformToElasticsearchEvent(errorEvent);
      
      await this.client.index({
        index: this.indexName,
        ...(errorEvent._id && { id: errorEvent._id }),
        body: elasticsearchEvent,
        refresh: false,
      });

      return {
        success: true,
        data: true,
        message: 'Error event indexed successfully',
      };
    } catch (error) {
      logger.error('Failed to index error event', { error, errorEventId: errorEvent._id });
      return {
        success: false,
        error: `Indexing failed: ${error}`,
      };
    }
  }

  public async searchErrorEvents(
    filters: IElasticsearchSearchFilters
  ): Promise<IElasticsearchServiceResult<IElasticsearchSearchResult>> {
    try {
      const query = this.buildSearchQuery(filters);
      
      const response = await this.client.search({
        index: this.indexName,
        body: query,
      });

      const result = this.mapSearchResponse(response, filters);

      return {
        success: true,
        data: result,
        message: `Found ${result.total} error events`,
        took: response.took,
      };
    } catch (error) {
      logger.error('Failed to search error events', { error, filters });
      return {
        success: false,
        error: `Search failed: ${error}`,
      };
    }
  }

  public async getErrorEventStats(
    filters?: Partial<IElasticsearchSearchFilters>
  ): Promise<IElasticsearchServiceResult<IElasticsearchStats>> {
    try {
      const query = this.buildStatsQuery(filters);
      
      const response = await this.client.search({
        index: this.indexName,
        body: query,
      });

      const aggregations = response.aggregations;
      if (!aggregations) {
        return {
          success: false,
          error: 'No aggregations found in response',
        };
      }

      const stats: IElasticsearchStats = {
        totalErrors: (aggregations['total_errors'] as any)?.value || 0,
        errorsByBrowser: this.formatBucketAggregationToObject(aggregations['errors_by_browser']),
        errorsByUrl: this.formatBucketAggregationToObject(aggregations['errors_by_url']),
        topErrorMessages: this.formatBucketAggregation(aggregations['top_error_messages'])
          .map(item => ({ message: item.key, count: item.doc_count }))
          .slice(0, 5),
        errorsOverTime: this.formatBucketAggregation(aggregations['errors_over_time'])
          .map(item => ({ date: item.key_as_string, count: item.doc_count })),
        uniqueUsers: (aggregations['unique_users'] as any)?.value || 0,
        averageErrorsPerUser: 0,
      };

      if (stats.uniqueUsers > 0) {
        stats.averageErrorsPerUser = stats.totalErrors / stats.uniqueUsers;
      }

      return {
        success: true,
        data: stats,
        message: 'Error statistics retrieved successfully',
        took: response.took,
      };
    } catch (error) {
      logger.error('Failed to get error event statistics', { error });
      return {
        success: false,
        error: `Statistics retrieval failed: ${error}`,
      };
    }
  }

  private createIndexMapping() {
    return {
      mappings: {
        properties: {
          id: { type: 'keyword' as const },
          timestamp: { 
            type: 'date' as const,
            format: 'strict_date_optional_time||epoch_millis'
          },
          userId: { 
            type: 'keyword' as const,
            fields: {
              text: { type: 'text' as const, analyzer: 'standard' }
            }
          },
          browser: { 
            type: 'keyword' as const,
            fields: {
              text: { type: 'text' as const, analyzer: 'standard' }
            }
          },
          url: { 
            type: 'keyword' as const,
            fields: {
              text: { type: 'text' as const, analyzer: 'standard' }
            }
          },
          errorMessage: { 
            type: 'text' as const,
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' as const },
              suggest: { type: 'completion' as const }
            }
          },
          stackTrace: { 
            type: 'text' as const,
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' as const }
            }
          },
          createdAt: { 
            type: 'date' as const,
            format: 'strict_date_optional_time||epoch_millis'
          },
          updatedAt: { 
            type: 'date' as const,
            format: 'strict_date_optional_time||epoch_millis'
          },
        },
      },
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            custom_text_analyzer: {
              type: 'custom' as const,
              tokenizer: 'standard',
              filter: ['lowercase', 'stop', 'snowball'],
            },
          },
        },
      },
    };
  }

  private transformToElasticsearchEvent(errorEvent: IErrorEvent): IElasticsearchErrorEvent {
    return {
      id: errorEvent._id || '',
      timestamp: errorEvent.timestamp,
      userId: errorEvent.userId,
      browser: errorEvent.browser,
      url: errorEvent.url,
      errorMessage: errorEvent.errorMessage,
      stackTrace: errorEvent.stackTrace,
      createdAt: errorEvent.createdAt || new Date(),
      updatedAt: errorEvent.updatedAt || new Date(),
    };
  }

  private buildSearchQuery(filters: IElasticsearchSearchFilters): IElasticsearchSearchQuery {
    const pageSize = filters.pageSize || 20;
    const page = filters.page || 1;
    
    const query: IElasticsearchSearchQuery = {
      query: {
        bool: {
          must: [],
          filter: [],
        },
      },
      sort: [
        { [filters.sortBy || 'timestamp']: { order: filters.sortOrder || 'desc' } }
      ],
      from: (page - 1) * pageSize,
      size: pageSize,
    };
    const boolQuery = query.query!.bool!;
    const mustArray = boolQuery.must as any[];
    const filterArray = boolQuery.filter as any[];

    this.addFiltersToQuery(mustArray, filterArray, filters);

    if (mustArray.length === 0 && filterArray.length === 0) {
      (query.query as any) = { match_all: {} };
    }

    return query;
  }

  private addFiltersToQuery(mustArray: any[], filterArray: any[], filters: IElasticsearchSearchFilters | Partial<IElasticsearchSearchFilters>): void {
    if (filters.dateRange) {
      filterArray.push({
        range: {
          timestamp: {
            gte: filters.dateRange.start.toISOString(),
            lte: filters.dateRange.end.toISOString(),
          },
        },
      });
    }
    if (filters.userId) {
      filterArray.push({
        term: { userId: filters.userId },
      });
    }
    if (filters.browser) {
      filterArray.push({
        term: { browser: filters.browser },
      });
    }
    if (filters.url) {
      filterArray.push({
        bool: {
          should: [

            { term: { 'url.keyword': filters.url } },

            { wildcard: { 'url.keyword': `*${filters.url}*` } },

            { match: { 'url.text': filters.url } }
          ],
          minimum_should_match: 1
        }
      });
    }

    if (filters.keyword) {
      mustArray.push({
        multi_match: {
          query: filters.keyword,
          fields: ['errorMessage^2', 'stackTrace', 'userId.text', 'browser.text', 'url.text'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }
  }

  private buildStatsQuery(filters?: Partial<IElasticsearchSearchFilters>): IElasticsearchSearchQuery {
    const query: IElasticsearchSearchQuery = {
      query: {
        bool: {
          filter: [],
        },
      },
      size: 0,
      aggregations: {
        total_errors: {
          value_count: { field: 'id' },
        },
        unique_users: {
          cardinality: { field: 'userId' },
        },
        errors_by_browser: {
          terms: { field: 'browser', size: 10 },
        },
        errors_by_url: {
          terms: { field: 'url', size: 10 },
        },
        top_error_messages: {
          terms: { field: 'errorMessage.keyword', size: 5 },
        },
        errors_over_time: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: 'day',
            format: 'yyyy-MM-dd',
          },
        },
      },
    };

    const boolQuery = query.query!.bool!;
    const mustArray: any[] = [];
    const filterArray = boolQuery.filter as any[];

    if (filters) {
      this.addFiltersToQuery(mustArray, filterArray, filters);
    }

    return query;
  }

  private formatBucketAggregation(aggregation: any): any[] {
    if (!aggregation || !aggregation.buckets) {
      return [];
    }
    return aggregation.buckets;
  }

  public async disconnect(): Promise<IElasticsearchServiceResult<boolean>> {
    try {
      await this.client.close();      
      logger.info('Elasticsearch client disconnected');
      
      return {
        success: true,
        data: true,
        message: 'Elasticsearch client disconnected successfully',
      };
    } catch (error) {
      logger.error('Failed to disconnect Elasticsearch client', { error });
      return {
        success: false,
        error: `Elasticsearch disconnection failed: ${error}`,
      };
    }
  }

  private formatBucketAggregationToObject(aggregation: any): { [key: string]: number } {
    if (!aggregation || !aggregation.buckets) {
      return {};
    }
    const result: { [key: string]: number } = {};
    aggregation.buckets.forEach((bucket: any) => {
      result[bucket.key] = bucket.doc_count;
    });
    return result;
  }

  private mapSearchResponse(
    response: any, 
    filters: IElasticsearchSearchFilters
  ): IElasticsearchSearchResult {
    const total = this.extractTotalCount(response.hits.total);
    const pageSize = filters.pageSize || 20;
    
    return {
      data: this.mapHitsToErrorEvents(response.hits.hits),
      total,
      page: filters.page || 1,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      took: response.took,
      aggregations: response.aggregations || {},
    };
  }

  private extractTotalCount(total: any): number {
    return typeof total === 'number' ? total : total?.value || 0;
  }

  private mapHitsToErrorEvents(hits: any[]): IElasticsearchErrorEvent[] {
    return hits.map(hit => ({
      ...hit._source,
      id: hit._source.id || hit._id,
    } as IElasticsearchErrorEvent));
  }
}

export const elasticsearchService = ElasticsearchService.getInstance();