import dotenv from 'dotenv';
import app from './app';
import { 
  databaseService, 
  elasticsearchService, 
  redisService, 
  kafkaIntegratedService 
} from './data-layer';
import { mockErrorService } from './services/mock-error.service';
import { socketIOService } from './services/socketio.service';
import { logger } from './utils/logger.util';

dotenv.config();

const PORT = process.env['PORT'] || 3000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';

async function initializeServices(): Promise<void> {
  try {
    logger.info('Initializing services...');

    await databaseService.connect();
    logger.info('Database service initialized');

    const esResult = await elasticsearchService.initialize();
    if (!esResult.success) {
      throw new Error(`Elasticsearch initialization failed: ${esResult.error}`);
    }
    logger.info('Elasticsearch service initialized');

    const redisResult = await redisService.initialize();
    if (!redisResult.success) {
      throw new Error(`Redis initialization failed: ${redisResult.error}`);
    }
    logger.info('Redis service initialized');

    const kafkaResult = await kafkaIntegratedService.initialize();
    if (!kafkaResult.success) {
      throw new Error(`Kafka initialization failed: ${kafkaResult.error}`);
    }
    logger.info('Kafka service initialized');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed', { error });
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  try {
    await initializeServices();

    const server = app.listen(PORT, () => {
      logger.info(`Error Insights Dashboard API server started`, {
        port: PORT,
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
        pid: process.pid,
      });
    });

    socketIOService.initialize(server);

    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
        default:
          throw error;
      }
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          if (mockErrorService.isGenerating()) {
            mockErrorService.stopGeneratingErrors();
            logger.info('Mock error service stopped');
          }

          await Promise.allSettled([
            databaseService.disconnect(),
            elasticsearchService.disconnect(),
            redisService.disconnect(),
            kafkaIntegratedService.disconnect(),
          ]);
          
          logger.info('All services disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error });
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();