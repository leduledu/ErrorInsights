import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _isLoading = signal(false);
  private _loadingMessage = signal('Loading...');

  get isLoading() {
    return this._isLoading.asReadonly();
  }

  get loadingMessage() {
    return this._loadingMessage.asReadonly();
  }

  setLoading(isLoading: boolean, message: string = 'Loading...'): void {
    this._isLoading.set(isLoading);
    this._loadingMessage.set(message);
  }

  showLoading(message: string = 'Loading...'): void {
    this.setLoading(true, message);
  }

  hideLoading(): void {
    this.setLoading(false);
  }

  updateMessage(message: string): void {
    this._loadingMessage.set(message);
  }
}