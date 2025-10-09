import { Component, OnDestroy, inject, signal, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { RealtimeErrorService } from '../../services/realtime-error.service';
import { ErrorEvent } from '../../models/error-event.model';

@Component({
  selector: 'app-real-time-errors.component',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatButtonModule,
    ScrollingModule
  ],
  templateUrl: './real-time-errors.component.html',
  styleUrl: './real-time-errors.component.scss'
})

export class RealTimeErrorsComponent implements OnDestroy {
  errors = signal<ErrorEvent[]>([]);
  loadingInitial = signal(false);
  isAtTop = signal(true);
  newErrorCount = signal(0);

  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  private subscriptions: Subscription[] = [];
  private realtimeErrorService = inject(RealtimeErrorService);

  constructor() {
    effect(() => {
      // Initialize real-time error service
      this.loadingInitial.set(true);
      this.realtimeErrorService.connect();

      this.subscriptions.push(
        this.realtimeErrorService.initialErrors$.subscribe(errors => {
          this.errors.set(errors);
          this.loadingInitial.set(false);
        })
      );

      this.subscriptions.push(
        this.realtimeErrorService.newError$.subscribe(error => {
          if (error) {
            this.addNewError(error);
          }
        })
      );
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.realtimeErrorService.disconnect();
  }

  addNewError(error: ErrorEvent): void {
    this.errors.update(current => [error, ...current]);
    
    if (!this.isAtTop()) {
      this.newErrorCount.update(count => count + 1);
    }
  }

  onScrollToTop(): void {
    this.newErrorCount.set(0);
    this.isAtTop.set(true);
  }

  onScroll(): void {
    if (this.viewport) {
      const scrollTop = this.viewport.measureScrollOffset('top');
      this.isAtTop.set(scrollTop === 0);
    }
  }

  scrollToTop(): void {
    if (this.viewport) {
      this.viewport.scrollToIndex(0, 'smooth');
      this.onScrollToTop();
    }
  }

  trackByErrorId(index: number, error: ErrorEvent): string {
    return error._id || index.toString();
  }
}