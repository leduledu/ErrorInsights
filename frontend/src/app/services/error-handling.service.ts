import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  handleUnauthorizedError(): void {
    this.showError({
      title: 'Unauthorized',
      message: 'Your session has expired. Please log in again.',
      action: 'Login',
      duration: 5000
    });
    
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }

  handleForbiddenError(): void {
    this.showError({
      title: 'Access Denied',
      message: 'You do not have permission to access this resource.',
      duration: 4000
    });
  }

  handleNotFoundError(): void {
    this.showError({
      title: 'Not Found',
      message: 'The requested resource was not found.',
      duration: 3000
    });
  }

  handleServerError(error: HttpErrorResponse): void {
    this.showError({
      title: 'Server Error',
      message: 'An internal server error occurred. Please try again later.',
      duration: 5000
    });
    
    console.error('Server Error:', error);
  }

  handleGenericError(error: HttpErrorResponse): void {
    const message = error.error?.message || error.message || 'An unexpected error occurred.';
    
    this.showError({
      title: 'Error',
      message: message,
      duration: 4000
    });
  }

  handleNetworkError(): void {
    this.showError({
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      duration: 5000
    });
  }

  handleValidationError(errors: Record<string, string[]>): void {
    const errorMessages = Object.values(errors).flat();
    const message = errorMessages.join(', ');
    
    this.showError({
      title: 'Validation Error',
      message: message,
      duration: 4000
    });
  }

  private showError(errorMessage: ErrorMessage): void {
    const snackBarRef = this.snackBar.open(
      `${errorMessage.title}: ${errorMessage.message}`,
      errorMessage.action || 'Close',
      {
        duration: errorMessage.duration || 4000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );

    if (errorMessage.action && errorMessage.action !== 'Close') {
      snackBarRef.onAction().subscribe(() => {
        if (errorMessage.action === 'Login') {
          this.router.navigate(['/login']);
        }
      });
    }
  }

  showSuccess(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}