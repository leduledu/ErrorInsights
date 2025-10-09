import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { FilterErrorsComponent } from './filter-errors.component';
import { ErrorService } from '../../services/error.service';
import { LoadingService } from '../../services/loading.service';
import { ErrorEvent, ErrorStats, ApiResponse } from '../../models/error-event.model';

const mockErrorService = {
  searchEvents: jest.fn(),
  getErrorStats: jest.fn(),
  getBrowsers: jest.fn(),
  getUsers: jest.fn(),
  getUrls: jest.fn()
};

const mockLoadingService = {
  isLoading: jest.fn(() => false),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  loadingMessage: jest.fn(() => 'Loading...')
};

describe('FilterErrorsComponent', () => {
  let component: FilterErrorsComponent;
  let fixture: ComponentFixture<FilterErrorsComponent>;
  let errorService: jest.Mocked<ErrorService>;

  const mockErrorEvent: ErrorEvent = {
    _id: 'test-id-123',
    timestamp: '2024-01-01T12:00:00Z',
    userId: 'user-123',
    browser: 'Chrome',
    url: 'https://example.com',
    errorMessage: 'Test error message',
    stackTrace: 'Error: Test error\n    at test.js:1:1'
  };

  const mockErrorStats: ErrorStats = {
    totalErrors: 100,
    errorsByBrowser: { Chrome: 50, Firefox: 30, Safari: 20 },
    errorsByUrl: { 'https://example.com': 40, 'https://test.com': 35, 'https://demo.com': 25 },
    topErrorMessages: [
      { message: 'Test error message', count: 25 },
      { message: 'Another error', count: 20 }
    ],
    errorsOverTime: [
      { date: '2024-01-01', count: 10 },
      { date: '2024-01-02', count: 15 }
    ],
    uniqueUsers: 50,
    averageErrorsPerUser: 2
  };

  const mockSearchResponse: ApiResponse<{ data: ErrorEvent[]; total: number }> = {
    success: true,
    data: {
      data: [mockErrorEvent],
      total: 1
    }
  };

  const mockStatsResponse: ApiResponse<ErrorStats> = {
    success: true,
    data: mockErrorStats
  };

  const mockDropdownData = {
    browsers: ['Chrome', 'Firefox', 'Safari'],
    users: ['user-123', 'user-456', 'user-789'],
    urls: ['https://example.com', 'https://test.com', 'https://demo.com']
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockErrorService.searchEvents.mockReturnValue(of(mockSearchResponse));
    mockErrorService.getErrorStats.mockReturnValue(of(mockStatsResponse));
    mockErrorService.getBrowsers.mockReturnValue(of({ success: true, data: mockDropdownData.browsers }));
    mockErrorService.getUsers.mockReturnValue(of({ success: true, data: mockDropdownData.users }));
    mockErrorService.getUrls.mockReturnValue(of({ success: true, data: mockDropdownData.urls }));

    await TestBed.configureTestingModule({
      imports: [
        FilterErrorsComponent,
        ReactiveFormsModule
      ],
      providers: [
        FormBuilder,
        { provide: ErrorService, useValue: mockErrorService },
        { provide: LoadingService, useValue: mockLoadingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterErrorsComponent);
    component = fixture.componentInstance;
    errorService = TestBed.inject(ErrorService) as jest.Mocked<ErrorService>;

    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should call loadErrors and loadDropdownData on init', () => {
      expect(errorService.searchEvents).toHaveBeenCalled();
      expect(errorService.getErrorStats).toHaveBeenCalled();
      expect(errorService.getBrowsers).toHaveBeenCalled();
      expect(errorService.getUsers).toHaveBeenCalled();
      expect(errorService.getUrls).toHaveBeenCalled();
    });
  });

  describe('Form Handling', () => {
    it('should apply filters when applyFilters is called', () => {
      const loadErrorsSpy = jest.spyOn(component as any, 'loadErrors');
      
      component.applyFilters();
      
      expect(loadErrorsSpy).toHaveBeenCalled();
    });

    it('should clear filters and reload data when clearFilters is called', () => {
      const loadErrorsSpy = jest.spyOn(component as any, 'loadErrors');
      
      // Set some values first
      component.filterForm.patchValue({
        keyword: 'test',
        browser: 'Chrome',
        userId: 'user-123'
      });
      
      component.clearFilters();
      
      expect(component.filterForm.get('keyword')?.value).toBe('');
      expect(component.filterForm.get('browser')?.value).toBe('');
      expect(component.filterForm.get('userId')?.value).toBe('');
      expect(component.filterForm.get('url')?.value).toBe('');
      expect(component.filterForm.get('startDate')?.value).toBe('');
      expect(component.filterForm.get('endDate')?.value).toBe('');
      expect(component.filterForm.get('page')?.value).toBe(0);
      expect(component.filterForm.get('pageSize')?.value).toBe(25);
      expect(loadErrorsSpy).toHaveBeenCalled();
    });
  });

  describe('Error Loading', () => {
    it('should load errors with correct filters', () => {
      const filters = {
        keyword: 'test',
        browser: 'Chrome',
        userId: 'user-123',
        url: 'https://example.com',
        page: 0,
        pageSize: 25
      };

      component.filterForm.patchValue(filters);
      (component as any).loadErrors();

      expect(errorService.searchEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'test',
          browser: 'Chrome',
          userId: 'user-123',
          url: 'https://example.com',
          page: 0,
          pageSize: 25
        })
      );
    });

    it('should update errors signal when search is successful', () => {
      component.errors.set([]); // Reset to empty
      
      (component as any).loadErrors();
      
      expect(component.errors()).toEqual([mockErrorEvent]);
      expect(component.totalErrors()).toBe(1);
    });

    it('should update errorStats signal when stats are loaded', () => {
      component.errorStats.set({
        totalErrors: 0,
        errorsByBrowser: {},
        errorsByUrl: {},
        topErrorMessages: [],
        errorsOverTime: [],
        uniqueUsers: 0,
        averageErrorsPerUser: 0
      });
      
      (component as any).loadErrors();
      
      expect(component.errorStats()).toEqual(mockErrorStats);
    });
  });

  describe('Dropdown Data Loading', () => {
    it('should load and set browsers data', () => {
      (component as any).loadDropdownData();
      
      expect(errorService.getBrowsers).toHaveBeenCalled();
      expect(component.browsers()).toEqual(mockDropdownData.browsers);
    });

    it('should load and set users data', () => {
      (component as any).loadDropdownData();
      
      expect(errorService.getUsers).toHaveBeenCalled();
      expect(component.users()).toEqual(mockDropdownData.users);
    });

    it('should load and set URLs data', () => {
      (component as any).loadDropdownData();
      
      expect(errorService.getUrls).toHaveBeenCalled();
      expect(component.urls()).toEqual(mockDropdownData.urls);
    });
  });
});
