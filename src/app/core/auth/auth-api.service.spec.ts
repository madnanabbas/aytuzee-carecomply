import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let api: AuthApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });

    api = TestBed.inject(AuthApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should post credentials only to the configured login endpoint', () => {
    const credentials = { email: 'user@carecomply.local', password: 'test-password' };

    api.login(credentials).subscribe();

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should use the configured current-user and csrf endpoints', () => {
    api.getCurrentUser().subscribe();
    const meRequest = http.expectOne('/api/auth/me');
    expect(meRequest.request.method).toBe('GET');
    meRequest.flush({ id: 'user-id', email: 'user@example.com', displayName: 'User', permissions: [] });

    api.getCsrfToken().subscribe();
    const csrfRequest = http.expectOne('/api/auth/csrf');
    expect(csrfRequest.request.method).toBe('GET');
    csrfRequest.flush({ requestToken: 'csrf-token' });
  });

  it('should post logout without a request payload', () => {
    api.logout().subscribe();

    const request = http.expectOne('/api/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should use the focused password recovery endpoints and contracts', () => {
    api.requestPasswordReset('user@example.com').subscribe();
    const forgot = http.expectOne('/api/auth/password/forgot');
    expect(forgot.request.method).toBe('POST');
    expect(forgot.request.body).toEqual({ email: 'user@example.com' });
    forgot.flush({ message: 'Generic response' }, { status: 202, statusText: 'Accepted' });

    const resetRequest = {
      userId: 'f2cdf03e-bd6b-4e8c-a42e-6fbd62ffad71',
      token: 'opaque-token',
      newPassword: 'a-secure-password',
      confirmPassword: 'a-secure-password',
    };
    api.resetPassword(resetRequest).subscribe();
    const reset = http.expectOne('/api/auth/password/reset');
    expect(reset.request.method).toBe('POST');
    expect(reset.request.body).toEqual(resetRequest);
    reset.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should use the focused MFA endpoints and contracts', () => {
    api.getMfaContext().subscribe();
    const context = http.expectOne('/api/auth/mfa/context');
    expect(context.request.method).toBe('GET');
    context.flush({ status: 'mfaRequired', method: 'Email', requestToken: 'token' });

    api.beginMfaEnrollment().subscribe();
    const begin = http.expectOne('/api/auth/mfa/enrollment/begin');
    expect(begin.request.method).toBe('POST');
    expect(begin.request.body).toBeNull();
    begin.flush({ manualSetupKey: 'setup', qrCodeDataUrl: 'data:image/png;base64,AA==' });

    api.confirmMfaEnrollment('123456').subscribe();
    const confirm = http.expectOne('/api/auth/mfa/enrollment/confirm');
    expect(confirm.request.body).toEqual({ code: '123456' });
    confirm.flush({ recoveryCodes: Array.from({ length: 10 }, (_, index) => `code-${index}`) });

    api.verifyMfa('654321').subscribe();
    const verify = http.expectOne('/api/auth/mfa/verify');
    expect(verify.request.body).toEqual({ code: '654321' });
    verify.flush(null, { status: 204, statusText: 'No Content' });

    api.verifyMfaRecoveryCode('recovery-code').subscribe();
    const recovery = http.expectOne('/api/auth/mfa/recovery');
    expect(recovery.request.body).toEqual({ recoveryCode: 'recovery-code' });
    recovery.flush(null, { status: 204, statusText: 'No Content' });

    api.resendMfaEmailCode().subscribe();
    const resend = http.expectOne('/api/auth/mfa/email/resend');
    expect(resend.request.method).toBe('POST');
    expect(resend.request.body).toBeNull();
    resend.flush(null, { status: 204, statusText: 'No Content' });

    api.cancelMfa().subscribe();
    const cancel = http.expectOne('/api/auth/mfa/cancel');
    expect(cancel.request.body).toBeNull();
    cancel.flush(null, { status: 204, statusText: 'No Content' });
  });
});
