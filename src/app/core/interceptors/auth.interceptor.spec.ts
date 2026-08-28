import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from '../auth/auth-session.service';
import { API_BASE_URL } from '../config/app-config';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  const session = {
    csrfToken: vi.fn((): string | null => 'csrf-token'),
    handleSessionInvalid: vi.fn(),
    handleForbidden: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AuthSessionService, useValue: session },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should send credentials with every CareComply API request', () => {
    const client = TestBed.inject(HttpClient);

    client.post('/api/auth/login', {}).subscribe();
    const loginRequest = http.expectOne('/api/auth/login');
    expect(loginRequest.request.withCredentials).toBe(true);
    loginRequest.flush({ status: 'mfaEnrollmentRequired' }, { status: 202, statusText: 'Accepted' });

    client.get('/api/auth/mfa/context').subscribe();
    const mfaContextRequest = http.expectOne('/api/auth/mfa/context');
    expect(mfaContextRequest.request.withCredentials).toBe(true);
    mfaContextRequest.flush({});

    client.get('/api/auth/me').subscribe();
    const meRequest = http.expectOne('/api/auth/me');
    expect(meRequest.request.withCredentials).toBe(true);
    meRequest.flush({});
  });

  it('should not attach credentials to non-API requests', () => {
    const client = TestBed.inject(HttpClient);
    client.get('https://example.test/resource').subscribe();

    const request = http.expectOne('https://example.test/resource');
    expect(request.request.withCredentials).toBe(false);
    request.flush({});
  });

  it('should add the in-memory csrf token to unsafe API requests', () => {
    const client = TestBed.inject(HttpClient);
    client.post('/api/auth/logout', null).subscribe();

    const request = http.expectOne('/api/auth/logout');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should not add csrf to safe or non-API requests', () => {
    const client = TestBed.inject(HttpClient);
    client.get('/api/auth/me').subscribe();
    const safeRequest = http.expectOne('/api/auth/me');
    expect(safeRequest.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    safeRequest.flush({});

    client.post('https://example.test/resource', {}).subscribe();
    const externalRequest = http.expectOne('https://example.test/resource');
    expect(externalRequest.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    externalRequest.flush({});
  });

  it('should clear the session for a non-auth API 401', () => {
    const client = TestBed.inject(HttpClient);
    client.get('/api/clients').subscribe({ error: () => undefined });

    http.expectOne('/api/clients').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.handleSessionInvalid).toHaveBeenCalledOnce();
  });

  it('should leave login and me 401 handling to their session flows', () => {
    const client = TestBed.inject(HttpClient);
    client.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

    client.get('/api/auth/me').subscribe({ error: () => undefined });
    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });

    client.post('/api/auth/mfa/verify', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/auth/mfa/verify').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(session.handleSessionInvalid).not.toHaveBeenCalled();
  });

  it('should preserve session state and delegate authenticated 403 handling', () => {
    const client = TestBed.inject(HttpClient);
    client.get('/api/clients').subscribe({ error: () => undefined });

    http.expectOne('/api/clients').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(session.handleForbidden).toHaveBeenCalledOnce();
    expect(session.handleSessionInvalid).not.toHaveBeenCalled();
  });
});
