import { IErrorEvent } from './error-event.types';
import { ClientOptions, estypes } from '@elastic/elasticsearch';

export type IElasticsearchConfig = ClientOptions;
export type IElasticsearchSearchQuery = estypes.SearchRequest;

export interface IElasticsearchErrorEvent extends IErrorEvent {
  id: string;
}

export interface IElasticsearchSearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  browser?: string;
  url?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IElasticsearchSearchResult {
  data: IElasticsearchErrorEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  took: number;
  aggregations?: { [key: string]: any };
}

export interface IElasticsearchStats {
  totalErrors: number;
  errorsByBrowser: { [key: string]: number };
  errorsByUrl: { [key: string]: number };
  topErrorMessages: { message: string; count: number }[];
  errorsOverTime: { date: string; count: number }[];
  uniqueUsers: number;
  averageErrorsPerUser: number;
}

export interface IElasticsearchServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  took?: number;
}
