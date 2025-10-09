import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlingService } from '../services/error-handling.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandlingService = inject(ErrorHandlingService);
  
  const apiReq = req.clone({
    headers: req.headers
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
  });
  
  return next(apiReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        errorHandlingService.handleUnauthorizedError();
      } else if (error.status === 403) {
        errorHandlingService.handleForbiddenError();
      } else if (error.status === 404) {
        errorHandlingService.handleNotFoundError();
      } else if (error.status >= 500) {
        errorHandlingService.handleServerError(error);
      } else {
        errorHandlingService.handleGenericError(error);
      }
      
      return throwError(() => error);
    })
  );
};
