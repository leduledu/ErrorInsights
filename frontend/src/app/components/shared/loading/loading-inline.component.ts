import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-loading-inline',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-inline">
        <mat-spinner [diameter]="diameter()"></mat-spinner>
        <p class="loading-message">{{ message() || loadingService.loadingMessage() }}</p>
      </div>
    }
  `,
  styles: [`
    .loading-inline {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
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
export class LoadingInlineComponent {
  loadingService = inject(LoadingService);
  
  diameter = input(40);
  message = input<string>();
}
