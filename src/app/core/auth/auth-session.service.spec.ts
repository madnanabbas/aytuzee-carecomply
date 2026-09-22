import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { delay, Observable, of, throwError } from 'rxjs';
import { AuthorizationService } from '../authorization/authorization.service';
import { Permissions } from '../authorization/permissions';
import { NavigationService } from '../navigation/navigation.service';
import { AuthApiService } from './auth-api.service';
import { AuthSessionService } from './auth-session.service';
import {
  CsrfTokenResponse,
  CurrentUserResponse,
  LoginCredentials,
  MfaRequiredResponse,
  MfaContextResponse,
  MfaEnrollmentConfirmedResponse,
  MfaEnrollmentResponse,
} from './auth.models';

describe('AuthSessionService', () => {
  const navigation = {
    loadForSession: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
  };
  let api: AuthApiStub;
  let authorization: AuthorizationService;
  let router: RouterStub;
  let session: AuthSessionService;

  beforeEach(() => {
    api = new AuthApiStub();
    router = new RouterStub();
    navigation.loadForSession.mockClear();
    navigation.clear.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: NavigationService, useValue: navigation },
      ],
    });

    authorization = TestBed.inject(AuthorizationService);
    session = TestBed.inject(AuthSessionService);
  });

  it('should restore a session and backend-derived permissions from me and csrf', async () => {
    await session.initialize();

    expect(session.isInitialized()).toBe(true);
    expect(session.isAuthenticated()).toBe(true);
    expect(session.currentUser()?.displayName).toBe('Test User');
    expect(session.csrfToken()).toBe('csrf-token');
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(true);
    expect(navigation.loadForSession).toHaveBeenCalledWith('0198a5db-4000-7000-8000-000000000001');
  });

  it('refreshes permissions and navigation after role changes', async () => {
    await session.initialize();
    navigation.clear.mockClear();
    navigation.loadForSession.mockClear();

    await session.refreshPermissionsAndNavigation();

    expect(navigation.clear).toHaveBeenCalledOnce();
    expect(navigation.loadForSession).toHaveBeenCalledWith('0198a5db-4000-7000-8000-000000000001');
  });

  it('should initialize anonymously when me returns 401', async () => {
    api.meResponse = throwError(() => new HttpErrorResponse({ status: 401 }));

    await session.initialize();

    expect(session.status()).toBe('anonymous');
    expect(session.currentUser()).toBeNull();
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(false);
  });

  it('should fail closed when me contains an unknown permission', async () => {
    api.meResponse = of({ ...currentUserResponse(), permissions: ['Dashboard.View', 'Unknown.Edit'] });

    await session.initialize();

    expect(session.status()).toBe('unavailable');
    expect(session.currentUser()).toBeNull();
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(false);
  });

  it('should complete login through me and csrf before authenticating', async () => {
    const result = await session.login({ email: 'user@example.com', password: 'password' });

    expect(result.status).toBe('succeeded');
    expect(api.loginCalls).toBe(1);
    expect(api.meCalls).toBe(1);
    expect(api.csrfCalls).toBe(1);
    expect(session.isAuthenticated()).toBe(true);
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(true);
  });

  it.each([
    { statusCode: 401, expected: 'invalidCredentials' },
    { statusCode: 429, expected: 'rateLimited' },
    { statusCode: 500, expected: 'unavailable' },
    { statusCode: 0, expected: 'unavailable' },
  ])('should map login HTTP $statusCode safely', async ({ statusCode, expected }) => {
    api.loginResponse = throwError(() => new HttpErrorResponse({ status: statusCode }));

    await expect(
      session.login({ email: 'user@example.com', password: 'password' }),
    ).resolves.toEqual({ status: expected });
  });

  it('should handle MFA without establishing a frontend session', async () => {
    api.loginResponse = of(
      new HttpResponse({ status: 202, body: { status: 'mfaRequired' } }),
    );

    await expect(
      session.login({ email: 'user@example.com', password: 'password' }),
    ).resolves.toEqual({ status: 'mfaRequired' });
    expect(session.isAuthenticated()).toBe(false);
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(false);
  });

  it('should allow email delivery to exceed the ordinary ten-second auth timeout', async () => {
    vi.useFakeTimers();
    try {
      api.loginResponse = of(
        new HttpResponse({ status: 202, body: { status: 'mfaRequired' } }),
      ).pipe(delay(10_001));

      const login = session.login({ email: 'user@example.com', password: 'password' });
      await vi.advanceTimersByTimeAsync(10_001);

      await expect(login).resolves.toEqual({ status: 'mfaRequired' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('should distinguish enrollment and retain no permissions before completion', async () => {
    api.loginResponse = of(
      new HttpResponse({ status: 202, body: { status: 'mfaEnrollmentRequired' } }),
    );

    await expect(
      session.login({ email: 'user@example.com', password: 'password' }),
    ).resolves.toEqual({ status: 'mfaEnrollmentRequired' });
    expect(session.isAuthenticated()).toBe(false);
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(false);
  });

  it('should restore only safe route-local MFA context and its antiforgery token', async () => {
    const result = await session.prepareMfaContext();

    expect(result).toEqual({ status: 'mfaRequired', method: 'Authenticator' });
    expect(session.mfaMethod()).toBe('Authenticator');
    expect(session.status()).toBe('anonymous');
    expect(session.csrfToken()).toBe('mfa-csrf-token');
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(false);
  });

  it('should complete MFA through me and csrf before loading permissions', async () => {
    const result = await session.verifyMfa('123456');

    expect(result).toEqual({ status: 'succeeded' });
    expect(api.verifyMfaCode).toBe('123456');
    expect(session.isAuthenticated()).toBe(true);
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(true);
  });

  it('should map an email-code resend without changing authentication state', async () => {
    const result = await session.resendMfaEmailCode();

    expect(result).toEqual({ status: 'succeeded' });
    expect(session.isAuthenticated()).toBe(false);
  });

  it('should map expired and invalid MFA failures without authenticating', async () => {
    api.verifyMfaResponse = throwError(() => new HttpErrorResponse({
      status: 401,
      error: { type: 'urn:carecomply:problem:mfa-challenge-expired' },
    }));
    await expect(session.verifyMfa('123456')).resolves.toEqual({ status: 'expired' });

    api.verifyMfaResponse = throwError(() => new HttpErrorResponse({
      status: 401,
      error: { type: 'urn:carecomply:problem:mfa-verification-failed' },
    }));
    await expect(session.verifyMfa('123456')).resolves.toEqual({ status: 'invalid' });
    expect(session.isAuthenticated()).toBe(false);
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(false);
  });

  it('should complete enrollment and expose exactly ten recovery codes from the response', async () => {
    const result = await session.confirmMfaEnrollment('123456');

    expect(result.status).toBe('succeeded');
    if (result.status !== 'succeeded') {
      throw new Error('Expected successful enrollment.');
    }
    expect(result.recoveryCodes).toHaveLength(10);
    expect(session.isAuthenticated()).toBe(true);
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(true);
  });

  it('should clear user, permissions, and csrf even when logout fails', async () => {
    await session.initialize();
    api.logoutResponse = throwError(() => new HttpErrorResponse({ status: 401 }));

    await session.logout();

    expect(session.status()).toBe('anonymous');
    expect(session.currentUser()).toBeNull();
    expect(session.csrfToken()).toBeNull();
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should clear session-invalid 401 state but preserve it for a forbidden response', async () => {
    await session.initialize();
    session.handleForbidden();

    expect(session.isAuthenticated()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);

    session.handleSessionInvalid();
    expect(session.isAuthenticated()).toBe(false);
    expect(authorization.hasPermission(Permissions.Dashboard.View)).toBe(false);
  });
});

function currentUserResponse(): CurrentUserResponse {
  return {
    id: '0198a5db-4000-7000-8000-000000000001',
    email: 'user@example.com',
    displayName: 'Test User',
    companyId: '0198a5db-4000-7000-8000-000000000002',
    companyName: 'Test Care Company',
    isPlatformAdministrator: false,
    permissions: [Permissions.Dashboard.View],
  };
}

class AuthApiStub {
  loginCalls = 0;
  meCalls = 0;
  csrfCalls = 0;
  loginResponse: Observable<HttpResponse<MfaRequiredResponse>> = of(
    new HttpResponse<MfaRequiredResponse>({ status: 204 }),
  );
  meResponse: Observable<CurrentUserResponse> = of(currentUserResponse());
  csrfResponse: Observable<CsrfTokenResponse> = of({ requestToken: 'csrf-token' });
  logoutResponse: Observable<void> = of(undefined);
  mfaContextResponse: Observable<MfaContextResponse> = of({
    status: 'mfaRequired',
    method: 'Authenticator',
    requestToken: 'mfa-csrf-token',
  });
  beginEnrollmentResponse: Observable<MfaEnrollmentResponse> = of({
    manualSetupKey: 'ABCD EFGH',
    qrCodeDataUrl: 'data:image/png;base64,AA==',
  });
  confirmEnrollmentResponse: Observable<MfaEnrollmentConfirmedResponse> = of({
    recoveryCodes: Array.from({ length: 10 }, (_, index) => `recovery-${index}`),
  });
  verifyMfaResponse: Observable<void> = of(undefined);
  verifyRecoveryResponse: Observable<void> = of(undefined);
  cancelMfaResponse: Observable<void> = of(undefined);
  resendMfaEmailResponse: Observable<void> = of(undefined);
  verifyMfaCode: string | null = null;

  login(_credentials: LoginCredentials): Observable<HttpResponse<MfaRequiredResponse>> {
    this.loginCalls += 1;
    return this.loginResponse;
  }

  getCurrentUser(): Observable<CurrentUserResponse> {
    this.meCalls += 1;
    return this.meResponse;
  }

  getCsrfToken(): Observable<CsrfTokenResponse> {
    this.csrfCalls += 1;
    return this.csrfResponse;
  }

  logout(): Observable<void> {
    return this.logoutResponse;
  }

  getMfaContext(): Observable<MfaContextResponse> {
    return this.mfaContextResponse;
  }

  beginMfaEnrollment(): Observable<MfaEnrollmentResponse> {
    return this.beginEnrollmentResponse;
  }

  confirmMfaEnrollment(_code: string): Observable<MfaEnrollmentConfirmedResponse> {
    return this.confirmEnrollmentResponse;
  }

  verifyMfa(code: string): Observable<void> {
    this.verifyMfaCode = code;
    return this.verifyMfaResponse;
  }

  verifyMfaRecoveryCode(_recoveryCode: string): Observable<void> {
    return this.verifyRecoveryResponse;
  }

  cancelMfa(): Observable<void> {
    return this.cancelMfaResponse;
  }

  resendMfaEmailCode(): Observable<void> {
    return this.resendMfaEmailResponse;
  }
}

class RouterStub {
  url = '/dashboard';
  readonly navigate = vi.fn().mockResolvedValue(true);
}
