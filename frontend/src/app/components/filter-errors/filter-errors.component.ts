import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ErrorService } from '../../services/error.service';
import { LoadingService } from '../../services/loading.service';
import { LoadingInlineComponent } from '../shared/loading/loading-inline.component';
import { StatsComponent } from '../stats/stats.component';
import { ErrorDetailsDialogComponent } from '../error-details-dialog/error-details-dialog.component';
import { ErrorEvent, ErrorStats } from '../../models/error-event.model';

@Component({
  selector: 'app-filter-errors',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatSortModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingInlineComponent,
    StatsComponent
  ],
  templateUrl: './filter-errors.component.html',
  styleUrl: './filter-errors.component.scss'
})
export class FilterErrorsComponent implements OnInit {
  displayedColumns: string[] = ['id', 'errorMessage', 'browser', 'url', 'timestamp', 'userId', 'actions'];
  
  errors = signal<ErrorEvent[]>([]);
  totalErrors = signal(0);
  
  errorStats = signal<ErrorStats>({
    totalErrors: 0,
    errorsByBrowser: {},
    errorsByUrl: {},
    topErrorMessages: [],
    errorsOverTime: [],
    uniqueUsers: 0,
    averageErrorsPerUser: 0
  });

  
  browsers = signal<string[]>([]);
  users = signal<string[]>([]);
  urls = signal<string[]>([]);
  
  filterForm: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private errorService: ErrorService,
    public loadingService: LoadingService,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      keyword: [''],
      browser: [''],
      userId: [''],
      url: [''],
      startDate: [''],
      endDate: [''],
      page: [0],
      pageSize: [25]
    });
  }

  ngOnInit(): void {
    this.loadErrors();
    this.loadDropdownData();
  }

  private loadDropdownData(): void {
    this.errorService.getBrowsers().subscribe((response) => {
      this.browsers.set(response.data);
    });

    this.errorService.getUsers().subscribe((response) => {
      this.users.set(response.data);
    });

    this.errorService.getUrls().subscribe((response) => {
      this.urls.set(response.data);
    });
  }

  private loadErrors(): void {
    this.loadingService.showLoading('Loading error events...');

    const formValue = this.filterForm.value;
    
    const filters: any = {
      keyword: formValue.keyword,
      browser: formValue.browser,
      userId: formValue.userId,
      url: formValue.url,
      page: formValue.page,
      pageSize: formValue.pageSize
    };

    if (formValue.startDate || formValue.endDate) {
      filters.dateRange = {};
      
      if (formValue.startDate && formValue.startDate !== '') {
        const startDate = new Date(formValue.startDate);
        if (!isNaN(startDate.getTime())) {
          startDate.setHours(0, 0, 0, 0);
          filters.dateRange.start = startDate.toISOString();
        }
      }
      
      if (formValue.endDate && formValue.endDate !== '') {
        const endDate = new Date(formValue.endDate);
        if (!isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
          filters.dateRange.end = endDate.toISOString();
        }
      }
    }
    
    this.errorService.searchEvents(filters).subscribe({
      next: (response) => {
        this.errors.set(response.data.data);
        this.totalErrors.set(response.data.total);
        this.loadingService.hideLoading();
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loadingService.hideLoading();
      }
    });

    this.errorService.getErrorStats(filters).subscribe({
      next: (response) => {
        this.errorStats.set(response.data);
        this.loadingService.hideLoading();
      },
      error: (error) => {
        console.error('Error loading error stats:', error);
        this.loadingService.hideLoading();
      }
    });
  }

  applyFilters(): void {
    this.loadErrors();
  }

  clearFilters(): void {
    this.filterForm.reset({
      keyword: '',
      browser: '',
      userId: '',
      url: '',
      startDate: '',
      endDate: '',
      page: 0,
      pageSize: 25
    });
    this.loadErrors();
  }

  onPageChange(event: PageEvent): void {
    this.filterForm.patchValue({
      page: event.pageIndex,
      pageSize: event.pageSize
    });
    this.loadErrors();
  }

  viewError(error: ErrorEvent): void {
    if (!error._id) {
      console.error('Error ID is required to view details');
      alert('Error ID is missing. Cannot view details.');
      return;
    }

    this.dialog.open(ErrorDetailsDialogComponent, {
      data: error,
      width: '800px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true
    });
  }

}