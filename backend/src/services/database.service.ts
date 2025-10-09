import mongoose from 'mongoose';
import { RepositoryError } from '../utils/repository-error.util';

export interface IDatabaseConfig {
  uri: string;
  options?: mongoose.ConnectOptions;
}

export interface IDatabaseConnection {
  isConnected: boolean;
  connectionState: string;
  host?: string;
  port?: number;
  name?: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private connection: mongoose.Connection | null = null;
  private config: IDatabaseConfig;

  private constructor() {
    this.config = {
      uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/error-insights',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        retryWrites: true,
        retryReads: true,
      },
    };
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (this.connection && this.connection.readyState === 1) {
        console.log('Database already connected');
        return;
      }
      console.log('Connecting to MongoDB...');
      
      await mongoose.connect(this.config.uri, this.config.options);
      
      this.connection = mongoose.connection;      

      this.setupEventListeners();
      
      console.log('Successfully connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw new RepositoryError(
        `Database connection failed: ${error}`,
        'CONNECTION_ERROR',
        503
      );
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.connection && this.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw new RepositoryError(
        `Database disconnection failed: ${error}`,
        'CONNECTION_ERROR',
        503
      );
    }
  }

  private setupEventListeners(): void {
    if (!this.connection) return;

    this.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    this.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    this.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    this.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }
}

export const databaseService = DatabaseService.getInstance();