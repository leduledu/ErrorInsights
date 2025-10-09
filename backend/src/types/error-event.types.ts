export interface IErrorEvent {
  _id?: string;
  timestamp: Date;
  userId: string;
  browser: string;
  url: string;
  errorMessage: string;
  stackTrace: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IErrorEventCreate {
  timestamp: Date;
  userId: string;
  browser: string;
  url: string;
  errorMessage: string;
  stackTrace: string;
}

export interface IErrorEventSearchFilters {
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

export interface IErrorEventSearchResult {
  data: IErrorEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IErrorEventStats {
  totalErrors: number;
  errorsByBrowser: { [key: string]: number };
  errorsByUrl: { [key: string]: number };
  topErrorMessages: { message: string; count: number }[];
  errorsOverTime: { date: string; count: number }[];
  uniqueUsers: number;
  averageErrorsPerUser: number;
}

export interface IRepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

