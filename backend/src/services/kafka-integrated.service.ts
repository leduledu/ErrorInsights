import { kafkaProducerService } from './kafka-producer.service';
import { kafkaConsumerService, IKafkaConsumerEventHandler } from './kafka-consumer.service';
import { ErrorEventCachedService } from './error-event-cached.service';
import {
  IKafkaServiceResult,
  IKafkaProducerResult,
} from '../types/kafka.types';
import { IErrorEventCreate } from '../types/error-event.types';
import { logger } from '../utils/logger.util';

export class KafkaIntegratedService {
  private static instance: KafkaIntegratedService;
  private dataService: ErrorEventCachedService;
  private isInitialized: boolean = false;

  private constructor() {
    this.dataService = new ErrorEventCachedService();
  }

  public static getInstance(): KafkaIntegratedService {
    if (!KafkaIntegratedService.instance) {
      KafkaIntegratedService.instance = new KafkaIntegratedService();
    }
    return KafkaIntegratedService.instance;
  }

  public async initialize(): Promise<IKafkaServiceResult<boolean>> {
    try {

      const dataServiceResult = await this.dataService.initialize();
      if (!dataServiceResult.success) {
        logger.warn('Data service initialization failed, continuing with Kafka only', {
          error: dataServiceResult.error,
        });
      }

      const producerResult = await kafkaProducerService.initialize();
      if (!producerResult.success) {
        logger.error('Kafka producer initialization failed', { error: producerResult.error });
        return {
          success: false,
          error: `Producer initialization failed: ${producerResult.error}`,
        };
      }

      const consumerResult = await kafkaConsumerService.initialize();
      if (!consumerResult.success) {
        logger.error('Kafka consumer initialization failed', { error: consumerResult.error });
        return {
          success: false,
          error: `Consumer initialization failed: ${consumerResult.error}`,
        };
      }

      kafkaConsumerService.registerEventHandler('error_event', this.handleErrorEvent.bind(this));

      const startResult = await kafkaConsumerService.startConsuming();
      if (!startResult.success) {
        logger.error('Failed to start Kafka consumer', { error: startResult.error });
        return {
          success: false,
          error: `Consumer start failed: ${startResult.error}`,
        };
      }
      this.isInitialized = true;
      
      logger.info('Kafka integrated service initialized successfully', {
        producerConnected: kafkaProducerService.isProducerConnected(),
        consumerConnected: kafkaConsumerService.isConsumerConnected(),
        consumerConsuming: kafkaConsumerService.isConsumerConsuming(),
      });

      return {
        success: true,
        data: true,
        message: 'Kafka integrated service initialized successfully',
      };
    } catch (error) {
      logger.error('Failed to initialize Kafka integrated service', { error });
      return {
        success: false,
        error: `Initialization failed: ${error}`,
      };
    }
  }

  public async sendErrorEvent(
    errorEvent: IErrorEventCreate
  ): Promise<IKafkaServiceResult<IKafkaProducerResult>> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Kafka integrated service is not initialized',
        };
      }

      const result = await kafkaProducerService.sendErrorEvent(errorEvent);
      
      if (result.success) {
        logger.info('Error event sent to Kafka', {
          eventId: errorEvent.userId,
          userId: errorEvent.userId,
          browser: errorEvent.browser,
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to send error event via Kafka', { error, userId: errorEvent.userId });
      return {
        success: false,
        error: `Failed to send error event: ${error}`,
      };
    }
  }

  private async handleErrorEvent(
    errorEvent: IErrorEventCreate
  ): Promise<void> {
    try {
      logger.debug('Processing error event from Kafka', {
        userId: errorEvent.userId,
        browser: errorEvent.browser,
      });

      const result = await this.dataService.createErrorEvent(errorEvent);
      
      if (result.success) {
        logger.info('Error event processed and stored successfully', {
          userId: errorEvent.userId,
          errorEventId: result.data?._id,
        });
      } else {
        logger.error('Failed to store error event from Kafka', {
          error: result.error,
          userId: errorEvent.userId,
        });
      }
    } catch (error) {
      logger.error('Error processing error event from Kafka', {
        error,
        userId: errorEvent.userId,
      });
    }
  }

  public registerEventHandler(eventType: string, handler: IKafkaConsumerEventHandler): void {
    kafkaConsumerService.registerEventHandler(eventType, handler);
    logger.debug('Custom event handler registered', { eventType });
  }

  public unregisterEventHandler(eventType: string): void {
    kafkaConsumerService.unregisterEventHandler(eventType);
    logger.debug('Event handler unregistered', { eventType });
  }

  public async stopConsuming(): Promise<IKafkaServiceResult<boolean>> {
    try {
      const result = await kafkaConsumerService.stopConsuming();
      
      if (result.success) {
        logger.info('Kafka consumer stopped successfully');
      }
      return result;
    } catch (error) {
      logger.error('Failed to stop Kafka consumer', { error });
      return {
        success: false,
        error: `Failed to stop consumer: ${error}`,
      };
    }
  }

  public async startConsuming(): Promise<IKafkaServiceResult<boolean>> {
    try {
      const result = await kafkaConsumerService.startConsuming();
      
      if (result.success) {
        logger.info('Kafka consumer started successfully');
      }

      return result;
    } catch (error) {
      logger.error('Failed to start Kafka consumer', { error });
      return {
        success: false,
        error: `Failed to start consumer: ${error}`,
      };
    }
  }

  public async disconnect(): Promise<IKafkaServiceResult<boolean>> {
    try {
      const [producerResult, consumerResult] = await Promise.all([
        kafkaProducerService.disconnect(),
        kafkaConsumerService.disconnect(),
      ]);

      this.isInitialized = false;

      const allDisconnected = producerResult.success && consumerResult.success;

      logger.info('Kafka integrated service disconnected', {
        producerDisconnected: producerResult.success,
        consumerDisconnected: consumerResult.success,
      });

      return {
        success: allDisconnected,
        data: allDisconnected,
        message: allDisconnected 
          ? 'All Kafka services disconnected successfully' 
          : 'Some Kafka services failed to disconnect',
      };
    } catch (error) {
      logger.error('Failed to disconnect Kafka integrated service', { error });
      return {
        success: false,
        error: `Disconnection failed: ${error}`,
      };
    }
  }
}

export const kafkaIntegratedService = KafkaIntegratedService.getInstance();
