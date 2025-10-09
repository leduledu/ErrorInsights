import { Document, Model, FilterQuery } from 'mongoose';
import {
  IBaseRepository,
  IRepositoryResult,
  IPaginatedResult,
  IQueryOptions,
  IPaginationOptions,
} from '../types/repository.types';
import { RepositoryError } from '../utils/repository-error.util';

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<IRepositoryResult<T>> {
    try {
      const document = new this.model(data);
      const savedDocument = await document.save();
      
      return {
        success: true,
        data: savedDocument,
        message: 'Document created successfully',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to create document');
    }
  }

  async findById(id: string): Promise<IRepositoryResult<T | null>> {
    try {
      const document = await this.model.findById(id);
      
      return {
        success: true,
        data: document,
        message: document ? 'Document found' : 'Document not found',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to find document by ID');
    }
  }

  async findOne(filter: FilterQuery<T>): Promise<IRepositoryResult<T | null>> {
    try {
      const document = await this.model.findOne(filter);
      
      return {
        success: true,
        data: document,
        message: document ? 'Document found' : 'Document not found',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to find document');
    }
  }

  async findMany(
    filter: FilterQuery<T>,
    options: IQueryOptions = {}
  ): Promise<IRepositoryResult<T[]>> {
    try {
      let query = this.model.find(filter);

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.skip) {
        query = query.skip(options.skip);
      }

      if (options.sort) {
        query = query.sort(options.sort);
      }

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.populate) {
        query = query.populate(options.populate);
      }

      const documents = await query.exec();
      
      return {
        success: true,
        data: documents,
        message: `Found ${documents.length} documents`,
      };
    } catch (error) {
      return this.handleError(error, 'Failed to find documents');
    }
  }

  async deleteById(id: string): Promise<IRepositoryResult<boolean>> {
    try {
      const result = await this.model.findByIdAndDelete(id);
      
      return {
        success: true,
        data: !!result,
        message: result ? 'Document deleted successfully' : 'Document not found',
      };
    } catch (error) {
      return this.handleError(error, 'Failed to delete document');
    }
  }

  async paginate(
    filter: FilterQuery<T>,
    options: IPaginationOptions
  ): Promise<IRepositoryResult<IPaginatedResult<T>>> {
    try {
      const { page, pageSize, sortBy, sortOrder } = options;
      const skip = (page - 1) * pageSize;
      
      const sort: { [key: string]: 1 | -1 } = {};
      if (sortBy) {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort['createdAt'] = -1;
      }

      const [documents, total] = await Promise.all([
        this.model.find(filter).sort(sort).skip(skip).limit(pageSize),
        this.model.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / pageSize);
      
      const result: IPaginatedResult<T> = {
        data: documents,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      return {
        success: true,
        data: result,
        message: `Retrieved page ${page} of ${totalPages}`,
        metadata: {
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      return this.handleError(error, 'Failed to paginate documents');
    }
  }

  protected handleError(error: any, message: string): IRepositoryResult<any> {
    console.error(`Repository Error: ${message}`, error);
    
    if (error instanceof RepositoryError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: message,
    };
  }
}
