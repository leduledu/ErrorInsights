import winston from 'winston';

const winstonLogger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'error-insights-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  public error(message: string, metadata?: any, requestId?: string, userId?: string): void {
    winstonLogger.error(message, { metadata, requestId, userId });
  }

  public warn(message: string, metadata?: any, requestId?: string, userId?: string): void {
    winstonLogger.warn(message, { metadata, requestId, userId });
  }

  public info(message: string, metadata?: any, requestId?: string, userId?: string): void {
    winstonLogger.info(message, { metadata, requestId, userId });
  }

  public debug(message: string, metadata?: any, requestId?: string, userId?: string): void {
    winstonLogger.debug(message, { metadata, requestId, userId });
  }

  public logDatabaseOperation(
    operation: string,
    collection: string,
    duration?: number,
    metadata?: any,
    requestId?: string
  ): void {
    const message = `Database ${operation} on ${collection}`;
    const logMetadata = {
      operation,
      collection,
      duration: duration ? `${duration}ms` : undefined,
      ...metadata,
    };
    
    this.info(message, logMetadata, requestId);
  }

  public logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration?: number,
    userId?: string,
    requestId?: string
  ): void {
    const message = `${method} ${url} ${statusCode}`;
    const metadata = {
      method,
      url,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    };
    
    this.info(message, metadata, requestId, userId);
  }

  public logErrorEvent(
    errorEvent: any,
    operation: string,
    requestId?: string,
    userId?: string
  ): void {
    const message = `Error event ${operation}`;
    const metadata = {
      operation,
      errorEvent: {
        userId: errorEvent.userId,
        browser: errorEvent.browser,
        url: errorEvent.url,
        errorMessage: errorEvent.errorMessage?.substring(0, 100),
      },
    };
    
    this.info(message, metadata, requestId, userId);
  }

  public logPerformance(
    operation: string,
    duration: number,
    metadata?: any,
    requestId?: string
  ): void {
    const message = `Performance: ${operation} completed in ${duration}ms`;
    this.info(message, { duration, ...metadata }, requestId);
  }

  public logSecurity(
    event: string,
    details: any,
    requestId?: string,
    userId?: string
  ): void {
    const message = `Security: ${event}`;
    this.warn(message, details, requestId, userId);
  }
}

export const logger = Logger.getInstance();