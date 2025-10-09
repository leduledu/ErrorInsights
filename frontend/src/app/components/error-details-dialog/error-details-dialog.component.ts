import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorEvent } from '../../models/error-event.model';

@Component({
  selector: 'app-error-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="error-details-dialog">
      <div mat-dialog-title class="dialog-header">
        <h2>Error Details</h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <div class="error-info">
          <div class="info-section">
            <h3>Basic Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Error ID:</label>
                <span class="value">{{ data._id || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>Timestamp:</label>
                <span class="value">{{ data.timestamp | date:'medium' }}</span>
              </div>
              <div class="info-item">
                <label>User ID:</label>
                <span class="value">{{ data.userId || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>Browser:</label>
                <span class="value">{{ data.browser || 'N/A' }}</span>
              </div>
              <div class="info-item full-width">
                <label>URL:</label>
                <span class="value url-value">{{ data.url || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="info-section">
            <h3>Error Message</h3>
            <div class="error-message">
              {{ data.errorMessage || 'N/A' }}
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="info-section">
            <h3>Stack Trace</h3>
            <div class="stack-trace">
              <pre>{{ data.stackTrace || 'No stack trace available' }}</pre>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="info-section">
            <h3>Additional Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Created At:</label>
                <span class="value">{{ data.createdAt | date:'medium' }}</span>
              </div>
              <div class="info-item">
                <label>Updated At:</label>
                <span class="value">{{ data.updatedAt | date:'medium' }}</span>
              </div>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button mat-dialog-close>Close</button>
        <button mat-raised-button color="primary" (click)="copyToClipboard()">
          <mat-icon>content_copy</mat-icon>
          Copy Details
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .error-details-dialog {
      max-width: 800px;
      max-height: 90vh;
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0;
      margin: 0;
    }

    .dialog-header h2 {
      margin: 0;
      color: #333;
    }

    .close-button {
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .dialog-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .error-info {
      padding: 16px 0;
    }

    .info-section {
      margin-bottom: 24px;
    }

    .info-section h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 18px;
      font-weight: 500;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-item label {
      font-weight: 600;
      color: #666;
      font-size: 14px;
    }

    .info-item .value {
      color: #333;
      word-break: break-all;
      padding: 8px 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      font-family: 'Roboto Mono', monospace;
      font-size: 13px;
    }

    .url-value {
      word-break: break-all;
      white-space: pre-wrap;
    }

    .error-message {
      padding: 12px 16px;
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 4px;
      font-family: 'Roboto Mono', monospace;
      font-size: 14px;
      color: #d32f2f;
      word-break: break-word;
    }

    .stack-trace {
      max-height: 300px;
      overflow-y: auto;
      background-color: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
    }

    .stack-trace pre {
      margin: 0;
      font-family: 'Roboto Mono', monospace;
      font-size: 12px;
      color: #333;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .dialog-actions {
      padding: 16px 24px;
      justify-content: flex-end;
      gap: 8px;
    }

    mat-divider {
      margin: 16px 0;
    }
  `]
})
export class ErrorDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ErrorDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorEvent
  ) {}

  copyToClipboard(): void {
    const errorDetails = `
Error Details:
ID: ${this.data._id || 'N/A'}
Timestamp: ${this.data.timestamp}
User ID: ${this.data.userId || 'N/A'}
Browser: ${this.data.browser || 'N/A'}
URL: ${this.data.url || 'N/A'}

Error Message:
${this.data.errorMessage || 'N/A'}

Stack Trace:
${this.data.stackTrace || 'No stack trace available'}

Created At: ${this.data.createdAt || 'N/A'}
Updated At: ${this.data.updatedAt || 'N/A'}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      console.log('Error details copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  }
}
