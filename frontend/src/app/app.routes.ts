import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/real-time-errors',
    pathMatch: 'full'
  },
  {
    path: 'real-time-errors',
    loadComponent: () => import('./components/real-time-errors/real-time-errors.component').then(m => m.RealTimeErrorsComponent),
    title: 'Real-time Errors - Error Insights'
  },
  {
    path: 'errors',
    loadComponent: () => import('./components/filter-errors/filter-errors.component').then(m => m.FilterErrorsComponent),
    title: 'Filter Errors - Error Insights'
  },
  {
    path: 'analytics',
    loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent),
    title: 'Widgets - Error Insights'
  },
  {
    path: 'mock-errors',
    loadComponent: () => import('./components/mock-errors/mock-errors.component').then(m => m.MockErrorsComponent),
    title: 'Mock Errors - Error Insights'
  },
  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found - Error Insights'
  }
];
