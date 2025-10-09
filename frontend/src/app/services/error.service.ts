import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ErrorEvent,
  ErrorEventResponse,
  ErrorStats,
  SearchFilters,
  ApiResponse,
} from '../models/error-event.model';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  searchEvents(filters: SearchFilters): Observable<ApiResponse<ErrorEventResponse>> {
    let params = new HttpParams();
    
    if (filters.dateRange?.start) {
      params = params.set('startDate', filters.dateRange.start);
    }
    if (filters.dateRange?.end) {
      params = params.set('endDate', filters.dateRange.end);
    }
    if (filters.keyword) {
      params = params.set('keyword', filters.keyword);
    }
    if (filters.userId) {
      params = params.set('userId', filters.userId);
    }
    if (filters.browser) {
      params = params.set('browser', filters.browser);
    }
    if (filters.keyword) {
      params = params.set('keyword', filters.keyword);
    }
    if (filters.url) {
      params = params.set('url', filters.url);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.pageSize) {
      params = params.set('pageSize', filters.pageSize.toString());
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<ApiResponse<ErrorEventResponse>>(
      `${this.apiUrl}/events/search`,
      { params }
    );
  }

  getErrorStats(filters?: Partial<SearchFilters>): Observable<ApiResponse<ErrorStats>> {
    let params = new HttpParams();
    
    if (filters?.dateRange?.start) {
      params = params.set('startDate', filters.dateRange.start);
    }
    if (filters?.dateRange?.end) {
      params = params.set('endDate', filters.dateRange.end);
    }
    if (filters?.browser) {
      params = params.set('browser', filters.browser);
    }

    return this.http.get<ApiResponse<ErrorStats>>(
      `${this.apiUrl}/events/stats`,
      { params }
    );
  }

  getErrorEvent(id: string): Observable<ApiResponse<ErrorEvent>> {
    return this.http.get<ApiResponse<ErrorEvent>>(`${this.apiUrl}/events/${id}`);
  }

  getBrowsers(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/events/browsers`);
  }

  getUrls(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/events/urls`);
  }

  getUsers(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/events/users`);
  }

  startMockErrors(intervalMs?: number, errorCount?: number): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    
    if (intervalMs !== undefined) {
      params = params.set('intervalMs', intervalMs.toString());
    }
    if (errorCount !== undefined) {
      params = params.set('errorCount', errorCount.toString());
    }

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/events/mock/start`,
      { params }
    );
  }

  healthCheck(): Observable<ApiResponse<{ status: string; timestamp: string }>> {
    return this.http.get<ApiResponse<{ status: string; timestamp: string }>>(
      `${this.apiUrl}/health`
    );
  }
}