import { Server, Socket } from 'socket.io';
import { errorEventCachedService } from './error-event-cached.service';
import { IErrorEvent } from '../types/error-event.types';
import { logger } from '../utils/logger.util';

export class SocketIOService {
  private static instance: SocketIOService;
  private io: Server | null = null;
  private connectedClients: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): SocketIOService {
    if (!SocketIOService.instance) {
      SocketIOService.instance = new SocketIOService();
    }
    return SocketIOService.instance;
  }

  public initialize(server: any): void {
    this.io = new Server(server, {
      cors: {
        origin: process.env['FRONTEND_URL'] || 'http://localhost:4200',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.IO service initialized');
  }

  private handleConnection(socket: Socket): void {
    this.connectedClients.add(socket.id);
    logger.info('Client connected', { socketId: socket.id });

    socket.on('subscribe:errors', async () => {
      await this.sendInitialErrors(socket);
    });

    socket.on('disconnect', () => {
      this.connectedClients.delete(socket.id);
      logger.info('Client disconnected', { socketId: socket.id });
    });
  }

  private async sendInitialErrors(socket: Socket): Promise<void> {
    try {
      const searchFilters = {
        page: 1,
        pageSize: 50,
        sortBy: 'timestamp',
        sortOrder: 'desc' as const,
      };

      const result = await errorEventCachedService.searchErrorEvents(searchFilters);
      
      if (result.success && result.data) {
        socket.emit('errors:initial', result.data.data);
        logger.info('Sent initial errors to client', { 
          socketId: socket.id, 
          count: result.data.data.length 
        });
      }
    } catch (error) {
      logger.error('Failed to send initial errors', { error, socketId: socket.id });
    }
  }

  public broadcastNewError(errorEvent: IErrorEvent): void {
    if (!this.io) return;

    this.io.emit('errors:new', errorEvent);
    logger.debug('New error broadcasted', { 
      errorEventId: errorEvent._id, 
      userId: errorEvent.userId,
      clientCount: this.connectedClients.size 
    });
  }
}
export const socketIOService = SocketIOService.getInstance();