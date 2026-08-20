import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import {
  CsrfTokenResponse,
  CurrentUserResponse,
  LoginCredentials,
  MfaContextResponse,
  MfaEnrollmentConfirmedResponse,
  MfaEnrollmentResponse,
  MfaRequiredResponse,
} from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly http = inject(HttpClient);

  login(credentials: LoginCredentials): Observable<HttpResponse<MfaRequiredResponse>> {
    return this.http.post<MfaRequiredResponse>(this.authUrl('login'), credentials, {
      observe: 'response',
    });
  }

  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(this.authUrl('me'));
  }

  getCsrfToken(): Observable<CsrfTokenResponse> {
    return this.http.get<CsrfTokenResponse>(this.authUrl('csrf'));
  }

  logout(): Observable<void> {
    return this.http.post<void>(this.authUrl('logout'), null);
  }

  getMfaContext(): Observable<MfaContextResponse> {
    return this.http.get<MfaContextResponse>(this.authUrl('mfa/context'));
  }

  beginMfaEnrollment(): Observable<MfaEnrollmentResponse> {
    return this.http.post<MfaEnrollmentResponse>(this.authUrl('mfa/enrollment/begin'), null);
  }

  confirmMfaEnrollment(code: string): Observable<MfaEnrollmentConfirmedResponse> {
    return this.http.post<MfaEnrollmentConfirmedResponse>(
      this.authUrl('mfa/enrollment/confirm'),
      { code },
    );
  }

  verifyMfa(code: string): Observable<void> {
    return this.http.post<void>(this.authUrl('mfa/verify'), { code });
  }

  verifyMfaRecoveryCode(recoveryCode: string): Observable<void> {
    return this.http.post<void>(this.authUrl('mfa/recovery'), { recoveryCode });
  }

  cancelMfa(): Observable<void> {
    return this.http.post<void>(this.authUrl('mfa/cancel'), null);
  }

  private authUrl(endpoint: string): string {
    return `${this.apiBaseUrl}/auth/${endpoint}`;
  }
}
