import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { AuthSessionService } from './core/auth/auth-session.service';
import { AuthorizationService } from './core/authorization/authorization.service';
import { ALL_PERMISSIONS, Permissions } from './core/authorization/permissions';
import { signal } from '@angular/core';
import { NavigationService } from './core/navigation/navigation.service';
import { provideHttpClient } from '@angular/common/http';
import { provideAppConfig } from './core/config/app-config';

describe('App', () => {
  let authenticated: boolean;
  let mfaContextStatus: 'mfaRequired' | 'mfaEnrollmentRequired';
  const session = {
    initialize: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: () => authenticated,
    login: vi.fn(),
    prepareMfaContext: vi.fn(async () => ({ status: mfaContextStatus })),
    verifyMfa: vi.fn(),
    verifyMfaRecoveryCode: vi.fn(),
    cancelMfa: vi.fn(),
    mfaMethod: signal<'Authenticator' | 'Email' | null>('Authenticator').asReadonly(),
    currentUser: () => ({
      id: 'user-1',
      email: 'user@carecomply.local',
      displayName: 'Care Comply',
      permissions: ALL_PERMISSIONS,
    }),
    logout: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    authenticated = true;
    mfaContextStatus = 'mfaRequired';
    session.initialize.mockClear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        ...provideAppConfig({
          apiBaseUrl: '/api',
          postalLookupBaseUrl: '/postal',
          geographyBaseUrl: '/geography',
        }),
        { provide: AuthSessionService, useValue: session },
        {
          provide: NavigationService,
          useValue: {
            groups: signal([]).asReadonly(),
            status: signal('loaded').asReadonly(),
            findByUrl: () => undefined,
            firstAllowedPath: () => '/dashboard',
          },
        },
      ],
    }).compileComponents();

    TestBed.inject(AuthorizationService).setPermissions(ALL_PERMISSIONS);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should provide the root application route outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it.each([
    { path: '/dashboard', title: 'Dashboard' },
    { path: '/clients', title: 'Clients' },
    { path: '/dhs-library', title: 'DHS Library' },
  ])(
    'should resolve $path through the app shell and lazy feature route',
    async ({ path, title }) => {
      const fixture = TestBed.createComponent(App);
      const router = TestBed.inject(Router);
      fixture.detectChanges();

      await expect(router.navigateByUrl(path)).resolves.toBe(true);
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(router.url).toBe(path);
      expect(compiled.querySelector('app-shell')).toBeTruthy();
      expect(compiled.querySelector('h1')?.textContent).toContain(title);
    },
  );

  it('should resolve the login route outside the application shell', async () => {
    authenticated = false;
    TestBed.inject(AuthorizationService).clearPermissions();
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await expect(router.navigateByUrl('/auth/login')).resolves.toBe(true);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(router.url).toBe('/auth/login');
    expect(compiled.querySelector('app-login-page')).toBeTruthy();
    expect(compiled.querySelector('app-shell')).toBeFalsy();
  });

  it('should resolve the server-approved MFA challenge outside the application shell', async () => {
    authenticated = false;
    TestBed.inject(AuthorizationService).clearPermissions();
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await expect(router.navigateByUrl('/auth/mfa')).resolves.toBe(true);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(router.url).toBe('/auth/mfa');
    expect(compiled.querySelector('app-mfa-challenge-page')).toBeTruthy();
    expect(compiled.querySelector('app-shell')).toBeFalsy();
  });

  it('should redirect an anonymous dashboard navigation to login', async () => {
    authenticated = false;
    TestBed.inject(AuthorizationService).clearPermissions();
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await expect(router.navigateByUrl('/dashboard')).resolves.toBe(true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/auth/login');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-shell')).toBeFalsy();
  });

  it('should route an authenticated user without Dashboard.View to forbidden', async () => {
    TestBed.inject(AuthorizationService).clearPermissions();
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await expect(router.navigateByUrl('/dashboard')).resolves.toBe(true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/forbidden');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-shell')).toBeTruthy();
  });

  it('should resolve the forbidden route through the app shell', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await expect(router.navigateByUrl('/forbidden')).resolves.toBe(true);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(router.url).toBe('/forbidden');
    expect(compiled.querySelector('app-shell')).toBeTruthy();
    expect(compiled.querySelector('app-forbidden h1')?.textContent).toContain('Access denied');
  });
});
