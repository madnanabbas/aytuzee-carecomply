import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthSessionService } from '../auth/auth-session.service';
import { API_BASE_URL } from '../config/app-config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);
const LOCALLY_HANDLED_AUTH_ENDPOINTS = ['/auth/login', '/auth/me', '/auth/csrf', '/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBaseUrl = inject(API_BASE_URL);
  const session = inject(AuthSessionService);
  const isApiRequest = request.url === apiBaseUrl || request.url.startsWith(`${apiBaseUrl}/`);
  const csrfToken = session.csrfToken();
  const requestWithCsrf =
    isApiRequest && !SAFE_METHODS.has(request.method.toUpperCase()) && csrfToken
      ? request.clone({ setHeaders: { 'X-XSRF-TOKEN': csrfToken } })
      : request;

  return next(requestWithCsrf).pipe(
    catchError((error: unknown) => {
      if (isApiRequest && error instanceof HttpErrorResponse) {
        if (error.status === 401 && !isLocallyHandledAuthEndpoint(request.url, apiBaseUrl)) {
          session.handleSessionInvalid();
        } else if (error.status === 403) {
          session.handleForbidden();
        }
      }

      return throwError(() => error);
    }),
  );
};

function isLocallyHandledAuthEndpoint(url: string, apiBaseUrl: string): boolean {
  if (url.startsWith(`${apiBaseUrl}/auth/mfa/`)) {
    return true;
  }

  return LOCALLY_HANDLED_AUTH_ENDPOINTS.some(
    (endpoint) => url === `${apiBaseUrl}${endpoint}`,
  );
}
