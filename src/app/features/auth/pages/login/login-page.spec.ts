import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuthenticatedLandingService } from '../../../../core/auth/authenticated-landing.service';
import { LoginAttemptResult, LoginCredentials } from '../../../../core/auth/auth.models';
import { LoginPageComponent } from './login-page';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let element: HTMLElement;
  let router: Router;
  let session: AuthSessionStub;

  beforeEach(async () => {
    session = new AuthSessionStub();
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: session },
        {
          provide: AuthenticatedLandingService,
          useValue: { firstAllowedPath: () => '/dashboard' },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('should render branding and labelled fields with approved autocomplete values', () => {
    const email = element.querySelector<HTMLInputElement>('#email');
    const password = element.querySelector<HTMLInputElement>('#password');

    const logo = element.querySelector<HTMLImageElement>('img[alt="Aytuzee Care Comply"]');
    expect(logo?.getAttribute('src')).toBe('/images/logo.png');
    expect(element.textContent).toContain('Aytuzee Care Comply');
    expect(element.querySelector('label[for="email"]')?.textContent).toContain('Email address');
    expect(email?.type).toBe('email');
    expect(email?.autocomplete).toBe('username');
    expect(element.querySelector('label[for="password"]')?.textContent).toContain('Password');
    expect(password?.type).toBe('password');
    expect(password?.autocomplete).toBe('current-password');
  });

  it('should require a valid email and password without calling the API', async () => {
    await component.submit();
    fixture.detectChanges();

    expect(session.login).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Email address is required.');
    expect(element.textContent).toContain('Password is required.');

    component.loginForm.setValue({ email: 'invalid-email', password: 'password' });
    await component.submit();
    fixture.detectChanges();

    expect(session.login).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter a valid email address.');
  });

  it('should complete real session orchestration and navigate to the landing route', async () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.loginForm.setValue({ email: 'user@example.com', password: 'secret-value' });

    await component.submit();

    expect(session.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret-value',
    });
    expect(component.loginForm.controls.password.value).toBe('');
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it.each([
    { status: 'invalidCredentials', message: 'Email or password is incorrect.' },
    { status: 'rateLimited', message: 'Too many sign-in attempts. Please wait and try again.' },
    { status: 'unavailable', message: "We couldn't sign you in right now. Please try again." },
  ] satisfies readonly { status: LoginAttemptResult['status']; message: string }[])(
    'should render a safe $status error',
    async ({ status, message }) => {
      session.result = { status } as LoginAttemptResult;
      component.loginForm.setValue({ email: 'user@example.com', password: 'secret-value' });

      await component.submit();
      fixture.detectChanges();

      expect(element.querySelector('[role="alert"]')?.textContent).toContain(message);
      expect(component.loginForm.controls.password.value).toBe('');
    },
  );

  it.each([
    { status: 'mfaRequired', route: '/auth/mfa' },
    { status: 'mfaEnrollmentRequired', route: '/auth/mfa/setup' },
  ] satisfies readonly { status: LoginAttemptResult['status']; route: string }[])(
    'should route $status without establishing a local session',
    async ({ status, route }) => {
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      session.result = { status } as LoginAttemptResult;
      component.loginForm.setValue({ email: 'user@example.com', password: 'secret-value' });

      await component.submit();

      expect(navigate).toHaveBeenCalledWith([route]);
      expect(component.loginForm.controls.password.value).toBe('');
    },
  );

  it('should show and hide the password locally', () => {
    const password = element.querySelector<HTMLInputElement>('#password');
    const toggle = element.querySelector<HTMLButtonElement>('button[aria-label="Show password"]');

    expect(password?.type).toBe('password');
    toggle?.click();
    fixture.detectChanges();

    expect(password?.type).toBe('text');
    expect(element.querySelector('button[aria-label="Hide password"]')).toBeTruthy();
  });

  it('should not render registration, social-login, or browser-storage behavior', () => {
    const storageSet = vi.spyOn(Storage.prototype, 'setItem');
    const copy = element.textContent?.toLowerCase() ?? '';

    expect(copy).not.toContain('register');
    expect(copy).not.toContain('sign up');
    expect(copy).not.toContain('google');
    expect(copy).not.toContain('microsoft');
    expect(copy).not.toContain('remember me');
    expect(copy).toContain('forgot password');
    expect(storageSet).not.toHaveBeenCalled();
    storageSet.mockRestore();
  });
});

class AuthSessionStub {
  result: LoginAttemptResult = { status: 'succeeded' };
  readonly login = vi.fn(
    async (_credentials: LoginCredentials): Promise<LoginAttemptResult> => this.result,
  );
}
