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

  // CareComply uses secure HttpOnly cookies for authentication and temporary MFA state.
  // Staging currently hosts Angular and the API on different sites, so every API request
  // must opt in to browser credentials. The backend cookie itself is configured as
  // Secure + SameSite=None for this cross-site staging flow.
  let preparedRequest = isApiRequest
    ? request.clone({ withCredentials: true })
    : request;

  if (isApiRequest && !SAFE_METHODS.has(request.method.toUpperCase()) && csrfToken) {
    preparedRequest = preparedRequest.clone({
      setHeaders: { 'X-XSRF-TOKEN': csrfToken },
    });
  }

  return next(preparedRequest).pipe(
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
