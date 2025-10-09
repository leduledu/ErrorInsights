import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import {
  IKafkaConfig,
  IKafkaConsumerConfig,
  IKafkaServiceResult,
  IKafkaErrorEventMessage,
} from '../types/kafka.types';
import { IErrorEventCreate } from '../types/error-event.types';
import { logger } from '../utils/logger.util';

export interface IKafkaConsumerEventHandler {
  (errorEvent: IErrorEventCreate): Promise<void>;
}

export class KafkaConsumerService {
  private static instance: KafkaConsumerService;
  private kafka: Kafka;
  private consumer: Consumer;
  private config: IKafkaConfig;
  private consumerConfig: IKafkaConsumerConfig;
  private readonly topicName: string;
  private isConnected: boolean = false;
  private isConsuming: boolean = false;
  private eventHandlers: Map<string, IKafkaConsumerEventHandler> = new Map();

  private constructor() {
    this.topicName = process.env['KAFKA_TOPIC'] || 'error-events';
    this.config = {
      brokers: (process.env['KAFKA_BROKERS'] || 'localhost:9092').split(','),
      clientId: process.env['KAFKA_CLIENT_ID'] || 'error-insights-consumer',
      retry: {
        retries: 3,
        initialRetryTime: 100,
        maxRetryTime: 30000,
      },
      connectionTimeout: 3000,
      requestTimeout: 25000,
    };

    this.consumerConfig = {
      groupId: process.env['KAFKA_GROUP_ID'] || 'error-insights-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576,
      minBytes: 1,
      maxWaitTimeInMs: 5000,
      retry: {
        retries: 3,
        initialRetryTime: 100,
        maxRetryTime: 30000,
      },
    };

    this.kafka = new Kafka(this.config);

    this.consumer = this.kafka.consumer(this.consumerConfig);
  }

  public static getInstance(): KafkaConsumerService {
    if (!KafkaConsumerService.instance) {
      KafkaConsumerService.instance = new KafkaConsumerService();
    }
    return KafkaConsumerService.instance;
  }

  public async initialize(): Promise<IKafkaServiceResult<boolean>> {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      
      logger.info('Kafka consumer connected successfully', {
        brokers: this.config.brokers,
        clientId: this.config.clientId,
        groupId: this.consumerConfig.groupId,
        topic: this.topicName,
      });

      return {
        success: true,
        data: true,
        message: 'Kafka consumer initialized successfully',
      };
    } catch (error) {
      logger.error('Failed to initialize Kafka consumer', { error });
      return {
        success: false,
        error: `Kafka consumer initialization failed: ${error}`,
      };
    }
  }

  public async startConsuming(): Promise<IKafkaServiceResult<boolean>> {
    try {
      if (!this.isConnected) {
        return {
          success: false,
          error: 'Kafka consumer is not connected',
        };
      }

      if (this.isConsuming) {
        return {
          success: true,
          data: true,
          message: 'Consumer is already running',
        };
      }

      await this.consumer.subscribe({
        topics: [this.topicName],
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.isConsuming = true;
      
      logger.info('Kafka consumer started successfully', {
        topics: [this.topicName],
        groupId: this.consumerConfig.groupId,
      });

      return {
        success: true,
        data: true,
        message: 'Kafka consumer started successfully',
      };
    } catch (error) {
      logger.error('Failed to start Kafka consumer', { error });
      return {
        success: false,
        error: `Failed to start consumer: ${error}`,
      };
    }
  }

  public async stopConsuming(): Promise<IKafkaServiceResult<boolean>> {
    try {
      if (!this.isConsuming) {
        return {
          success: true,
          data: true,
          message: 'Consumer is not running',
        };
      }
      await this.consumer.stop();
      this.isConsuming = false;
      
      logger.info('Kafka consumer stopped successfully');

      return {
        success: true,
        data: true,
        message: 'Kafka consumer stopped successfully',
      };
    } catch (error) {
      logger.error('Failed to stop Kafka consumer', { error });
      return {
        success: false,
        error: `Failed to stop consumer: ${error}`,
      };
    }
  }

  public registerEventHandler(eventType: string, handler: IKafkaConsumerEventHandler): void {
    this.eventHandlers.set(eventType, handler);
    logger.debug('Event handler registered', { eventType });
  }

  public unregisterEventHandler(eventType: string): void {
    this.eventHandlers.delete(eventType);
    logger.debug('Event handler unregistered', { eventType });
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      const { topic, partition, message } = payload;
      
      if (!message.value) {
        logger.warn('Received message with no value', { topic, partition, offset: message.offset });
        return;
      }

      const messageValue = message.value.toString();
      logger.debug('Received message from Kafka', {
        topic,
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        timestamp: message.timestamp,
      });

      const kafkaMessage: IKafkaErrorEventMessage = JSON.parse(messageValue);
      
      if (!this.isValidErrorMessage(kafkaMessage)) {
        logger.warn('Invalid error event message received', {
          topic,
          partition,
          offset: message.offset,
          message: kafkaMessage,
        });
        return;
      }

      const errorEvent: IErrorEventCreate = {
        timestamp: new Date(kafkaMessage.data.timestamp),
        userId: kafkaMessage.data.userId,
        browser: kafkaMessage.data.browser,
        url: kafkaMessage.data.url,
        errorMessage: kafkaMessage.data.errorMessage,
        stackTrace: kafkaMessage.data.stackTrace,
      };

      const handler = this.eventHandlers.get(kafkaMessage.eventType);
      if (handler) {
        try {
          await handler(errorEvent);
          logger.debug('Error event processed successfully', {
            eventId: kafkaMessage.data.id,
            userId: errorEvent.userId,
            handler: kafkaMessage.eventType,
          });
        } catch (handlerError) {
          logger.error('Error in event handler', {
            error: handlerError,
            eventId: kafkaMessage.data.id,
            handler: kafkaMessage.eventType,
          });
        }
      } else {
        logger.warn('No handler registered for event type', {
          eventType: kafkaMessage.eventType,
          eventId: kafkaMessage.data.id,
        });
      }

    } catch (error) {
      logger.error('Failed to handle Kafka message', {
        error,
        topic: payload.topic,
        partition: payload.partition,
        offset: payload.message.offset,
      });
    }
  }

  private isValidErrorMessage(message: any): message is IKafkaErrorEventMessage {
    return (
      message &&
      typeof message === 'object' &&
      message.eventType === 'error_event' &&
      message.data &&
      typeof message.data === 'object' &&
      typeof message.data.id === 'string' &&
      typeof message.data.timestamp === 'string' &&
      typeof message.data.userId === 'string' &&
      typeof message.data.browser === 'string' &&
      typeof message.data.url === 'string' &&
      typeof message.data.errorMessage === 'string' &&
      typeof message.data.stackTrace === 'string'
    );
  }  

  public async disconnect(): Promise<IKafkaServiceResult<boolean>> {
    try {
      if (this.isConsuming) {
        await this.stopConsuming();
      }

      if (this.isConnected) {
        await this.consumer.disconnect();
        this.isConnected = false;
        logger.info('Kafka consumer disconnected');
      }
      return {
        success: true,
        data: true,
        message: 'Kafka consumer disconnected successfully',
      };
    } catch (error) {
      logger.error('Failed to disconnect Kafka consumer', { error });
      return {
        success: false,
        error: `Disconnection failed: ${error}`,
      };
    }
  }

  public isConsumerConnected(): boolean {
    return this.isConnected;
  }

  public isConsumerConsuming(): boolean {
    return this.isConsuming;
  }
}
export const kafkaConsumerService = KafkaConsumerService.getInstance();
