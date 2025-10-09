import { Document, FilterQuery } from 'mongoose';

export interface IBaseRepository<T extends Document> {
  create(data: Partial<T>): Promise<IRepositoryResult<T>>;
  findById(id: string): Promise<IRepositoryResult<T | null>>;
  findOne(filter: FilterQuery<T>): Promise<IRepositoryResult<T | null>>;
  findMany(filter: FilterQuery<T>, options?: IQueryOptions): Promise<IRepositoryResult<T[]>>;
  deleteById(id: string): Promise<IRepositoryResult<boolean>>;
  paginate(
    filter: FilterQuery<T>,
    options: IPaginationOptions
  ): Promise<IRepositoryResult<IPaginatedResult<T>>>;
}

export interface IRepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IQueryOptions {
  limit?: number;
  skip?: number;
  sort?: { [key: string]: 1 | -1 };
  select?: { [key: string]: 1 | 0 };
  populate?: string | string[];
}

export interface IPaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}