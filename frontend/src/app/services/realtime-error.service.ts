import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ErrorEvent } from '../models/error-event.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RealtimeErrorService {
  private socket: Socket | null = null;
  private isConnected = false;
  
  private initialErrorsSubject = new BehaviorSubject<ErrorEvent[]>([]);
  public initialErrors$ = this.initialErrorsSubject.asObservable();
  
  private newErrorSubject = new BehaviorSubject<ErrorEvent | null>(null);
  public newError$ = this.newErrorSubject.asObservable();
  
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {}

  connect(): void {
    if (this.socket && this.isConnected) {
      console.log('Already connected to Socket.IO');
      return;
    }

    const serverUrl = environment.socketUrl || 'http://localhost:3000';
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.isConnected = true;
      this.connectionStatusSubject.next(true);
      
      this.socket?.emit('subscribe:errors');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
    });

    this.socket.on('errors:initial', (errors: ErrorEvent[]) => {
      console.log('Received initial errors:', errors.length);
      this.initialErrorsSubject.next(errors);
    });

    this.socket.on('errors:new', (error: ErrorEvent) => {
      console.log('Received new error:', error);
      this.newErrorSubject.next(error);
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
    }
  }
  
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  getInitialErrors(): ErrorEvent[] {
    return this.initialErrorsSubject.value;
  }

  clearNewError(): void {
    this.newErrorSubject.next(null);
  }

  addNewErrorToInitialList(error: ErrorEvent): void {
    const currentErrors = this.initialErrorsSubject.value;
    const updatedErrors = [error, ...currentErrors];
    
    if (updatedErrors.length > 50) {
      updatedErrors.splice(50);
    }
    
    this.initialErrorsSubject.next(updatedErrors);
  }
}