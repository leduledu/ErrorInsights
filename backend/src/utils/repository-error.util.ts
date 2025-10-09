export class RepositoryError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'REPOSITORY_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource: string = 'Resource'): RepositoryError {
    return new RepositoryError(
      `${resource} not found`,
      'NOT_FOUND',
      404,
      true
    );
  }

  static validationError(message: string): RepositoryError {
    return new RepositoryError(
      `Validation error: ${message}`,
      'VALIDATION_ERROR',
      400,
      true
    );
  }

  static duplicateError(resource: string = 'Resource'): RepositoryError {
    return new RepositoryError(
      `${resource} already exists`,
      'DUPLICATE_ERROR',
      409,
      true
    );
  }

  static databaseError(message: string): RepositoryError {
    return new RepositoryError(
      `Database error: ${message}`,
      'DATABASE_ERROR',
      500,
      false
    );
  }

  static connectionError(message: string): RepositoryError {
    return new RepositoryError(
      `Connection error: ${message}`,
      'CONNECTION_ERROR',
      503,
      false
    );
  }
}