import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  if (req.url.includes('/health') || req.url.includes('/ping')) {
    return next(req);
  }
  
  loadingService.setLoading(true);
  
  return next(req).pipe(
    finalize(() => {
      loadingService.setLoading(false);
    })
  );
};