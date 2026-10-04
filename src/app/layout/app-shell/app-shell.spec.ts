import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { AuthorizationService } from '../../core/authorization/authorization.service';
import { Permissions } from '../../core/authorization/permissions';
import { AppShellComponent } from './app-shell';
import { NavigationService } from '../../core/navigation/navigation.service';

describe('AppShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            currentUser: signal({
              id: 'user-1',
              email: 'user@carecomply.local',
              displayName: 'Care Comply',
              permissions: [Permissions.Dashboard.View],
            }).asReadonly(),
            logout: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: NavigationService,
          useValue: {
            groups: signal([]).asReadonly(),
            status: signal('loaded').asReadonly(),
            findByUrl: () => undefined,
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(AuthorizationService).setPermissions([Permissions.Dashboard.View]);
  });

  it('should render the structural application regions', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
    expect(compiled.querySelector('main#main-content')).toBeTruthy();
    expect(compiled.querySelector('app-page-container')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should open the mobile drawer, prevent background interaction, and restore trigger focus', async () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const trigger = element.querySelector<HTMLButtonElement>('[aria-label="Open navigation"]');

    trigger?.click();
    fixture.detectChanges();
    await Promise.resolve();
    expect(element.querySelector('[aria-modal="true"]')).toBeTruthy();
    expect(element.querySelector('[inert]')).toBeTruthy();

    element.querySelector<HTMLButtonElement>('[aria-label="Close navigation overlay"]')?.click();
    fixture.detectChanges();
    await Promise.resolve();
    expect(element.querySelector('[aria-modal="true"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
