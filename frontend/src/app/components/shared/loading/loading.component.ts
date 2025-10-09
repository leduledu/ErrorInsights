import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-overlay">
        <mat-card class="loading-card">
          <mat-card-content class="loading-content">
            <mat-spinner [diameter]="diameter"></mat-spinner>
            <p class="loading-message">{{ loadingService.loadingMessage() }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-card {
      min-width: 200px;
      max-width: 300px;
      background-color: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      text-align: center;
    }

    .loading-message {
      margin-top: 16px;
      margin-bottom: 0;
      color: #666;
      font-size: 14px;
    }
  `]
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
  
  diameter = 40;
}