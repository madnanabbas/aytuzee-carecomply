import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { AuthorizationService } from '../../core/authorization/authorization.service';
import { Permissions } from '../../core/authorization/permissions';
import { HeaderComponent } from './header';

describe('HeaderComponent', () => {
  const user = signal({
    id: 'user-1',
    displayName: 'Adnan Abbas',
    email: 'admin@carecomply.local',
    permissions: [Permissions.Dashboard.View],
  });
  const session = {
    currentUser: user.asReadonly(),
    logout: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    session.logout.mockClear();
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([{ path: 'employees', component: HeaderComponent }]),
        { provide: AuthSessionService, useValue: session },
      ],
    });
  });

  it('should render real session identity, initials, and no role or fake count', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const copy = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(copy).toContain('AA');
    expect(copy).toContain('Adnan Abbas');
    expect(copy).toContain('admin@carecomply.local');
    expect(copy).not.toContain('System Administrator');
    expect((fixture.nativeElement as HTMLElement).querySelector('[aria-label="Notifications"]')).toBeNull();
  });

  it('should show notifications only with Notification.View and no count badge', () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.Notification.View]);
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector('[aria-label="Notifications"]');
    expect(link).toBeTruthy();
    expect(link?.textContent?.trim()).toBe('');
  });

  it('should expose an accessible account menu and restore focus when Escape closes it', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>('[aria-controls="account-menu"]');

    button?.click();
    fixture.detectChanges();
    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('#account-menu')?.textContent).toContain('Logout');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await Promise.resolve();
    expect(element.querySelector('#account-menu')).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('should close the account menu when focus interaction moves outside its control', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('[aria-controls="account-menu"]')?.click();
    fixture.detectChanges();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(element.querySelector('#account-menu')).toBeNull();
  });

  it('should delegate logout to AuthSessionService without owning authentication logic', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);

    await fixture.componentInstance.logout();

    expect(session.logout).toHaveBeenCalledOnce();
  });

  it('should update page context after navigation', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(HeaderComponent);
    await router.navigateByUrl('/employees');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Employees');
  });
});
