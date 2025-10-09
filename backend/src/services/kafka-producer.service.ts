import { Kafka, Producer } from 'kafkajs';
import {
  IKafkaConfig,
  IKafkaErrorEvent,
  IKafkaProducerResult,
  IKafkaServiceResult,
  IKafkaErrorEventMessage,
} from '../types/kafka.types';
import { IErrorEventCreate } from '../types/error-event.types';
import { logger } from '../utils/logger.util';

export class KafkaProducerService {
  private static instance: KafkaProducerService;
  private kafka: Kafka;
  private producer: Producer;
  private config: IKafkaConfig;
  private readonly topicName: string;
  private isConnected: boolean = false;

  private constructor() {
    this.topicName = process.env['KAFKA_TOPIC'] || 'error-events';
    this.config = {
      brokers: (process.env['KAFKA_BROKERS'] || 'localhost:9092').split(','),
      clientId: process.env['KAFKA_CLIENT_ID'] || 'error-insights-producer',
      retry: {
        retries: 3,
        initialRetryTime: 100,
        maxRetryTime: 30000,
      },
      connectionTimeout: 3000,
      requestTimeout: 25000,
    };

    this.kafka = new Kafka(this.config);

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });
  }

  public static getInstance(): KafkaProducerService {
    if (!KafkaProducerService.instance) {
      KafkaProducerService.instance = new KafkaProducerService();
    }
    return KafkaProducerService.instance;
  }

  public async initialize(): Promise<IKafkaServiceResult<boolean>> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      
      logger.info('Kafka producer connected successfully', {
        brokers: this.config.brokers,
        clientId: this.config.clientId,
        topic: this.topicName,
      });

      return {
        success: true,
        data: true,
        message: 'Kafka producer initialized successfully',
      };
    } catch (error) {
      logger.error('Failed to initialize Kafka producer', { error });
      return {
        success: false,
        error: `Kafka producer initialization failed: ${error}`,
      };
    }
  }

  public async sendErrorEvent(
    errorEvent: IErrorEventCreate
  ): Promise<IKafkaServiceResult<IKafkaProducerResult>> {
    try {
      if (!this.isConnected) {
        return {
          success: false,
          error: 'Kafka producer is not connected',
        };
      }

      const kafkaErrorEvent: IKafkaErrorEvent = {
        id: this.generateEventId(),
        timestamp: errorEvent.timestamp.toISOString(),
        userId: errorEvent.userId,
        browser: errorEvent.browser,
        url: errorEvent.url,
        errorMessage: errorEvent.errorMessage,
        stackTrace: errorEvent.stackTrace
      };

      const message: IKafkaErrorEventMessage = {
        eventType: 'error_event',
        data: kafkaErrorEvent,
        timestamp: new Date().toISOString(),
        source: 'error-insights-backend',
        version: '1.0.0',
      };

      const result = await this.producer.send({
        topic: this.topicName,
        messages: [
          {
            key: kafkaErrorEvent.id,
            value: JSON.stringify(message),
            headers: {
              eventType: 'error_event',
              userId: kafkaErrorEvent.userId,
              browser: kafkaErrorEvent.browser,
              timestamp: kafkaErrorEvent.timestamp,
            },
          },
        ],
      });

      const firstResult = result[0];
      if (!firstResult) {
        throw new Error('No result returned from Kafka producer');
      }

      const producerResult: IKafkaProducerResult = {
        ...firstResult,
        success: true,
        message: 'Error event sent successfully',
      };

      logger.debug('Error event sent to Kafka', {
        eventId: kafkaErrorEvent.id,
        userId: kafkaErrorEvent.userId,
        topic: this.topicName,
        partition: firstResult.partition,
        offset: firstResult.offset,
      });

      return {
        success: true,
        data: producerResult,
        message: 'Error event sent successfully',
        metadata: {
          topic: this.topicName,
          partition: firstResult.partition,
          offset: firstResult.offset,
          timestamp: kafkaErrorEvent.timestamp,
        },
      };
    } catch (error) {
      logger.error('Failed to send error event to Kafka', { error, userId: errorEvent.userId });
      return {
        success: false,
        error: `Failed to send error event: ${error}`,
      };
    }
  }

  public async disconnect(): Promise<IKafkaServiceResult<boolean>> {
    try {
      if (this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        logger.info('Kafka producer disconnected');
      }

      return {
        success: true,
        data: true,
        message: 'Kafka producer disconnected successfully',
      };
    } catch (error) {
      logger.error('Failed to disconnect Kafka producer', { error });
      return {
        success: false,
        error: `Disconnection failed: ${error}`,
      };
    }
  }
  public getConfig(): IKafkaConfig {
    return { ...this.config };
  }

  public isProducerConnected(): boolean {
    return this.isConnected;
  }

  private generateEventId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const kafkaProducerService = KafkaProducerService.getInstance();