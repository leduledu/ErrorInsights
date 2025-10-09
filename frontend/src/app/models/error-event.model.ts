export interface ErrorEvent {
  _id?: string;
  timestamp: string;
  userId: string;
  browser: string;
  url: string;
  errorMessage: string;
  stackTrace: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ErrorEventResponse {
  data: ErrorEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByBrowser: { [key: string]: number };
  errorsByUrl: { [key: string]: number };
  topErrorMessages: { message: string; count: number }[];
  errorsOverTime: { date: string; count: number }[];
  uniqueUsers: number;
  averageErrorsPerUser: number;
}

export interface SearchFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  userId?: string;
  browser?: string;
  keyword?: string;
  url?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
