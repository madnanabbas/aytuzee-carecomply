import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthorizationService } from '../../core/authorization/authorization.service';
import { Permissions } from '../../core/authorization/permissions';
import { SidebarComponent } from './sidebar';

@Component({ template: '' })
class EmptyRouteComponent {}

describe('SidebarComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: EmptyRouteComponent },
          { path: 'employees', component: EmptyRouteComponent },
        ]),
      ],
    });
  });

  it('should use the official logo and hide unauthorized navigation', () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.Employee.View]);
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const copy = element.textContent ?? '';

    expect(element.querySelector('img[alt="Aytuzee Care Comply"]')?.getAttribute('src')).toBe(
      '/images/logo.png',
    );
    expect(copy).toContain('Employees');
    expect(copy).not.toContain('Clients');
    expect(copy).not.toContain('Access & Permissions');
  });

  it('should set aria-current and the restrained indicator on the active route', async () => {
    TestBed.inject(AuthorizationService).setPermissions([
      Permissions.Dashboard.View,
      Permissions.Employee.View,
    ]);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(SidebarComponent);
    await router.navigateByUrl('/employees');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const active = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      'a[aria-current="page"]',
    );
    expect(active?.textContent).toContain('Employees');
    expect(active?.classList.contains('bg-primary-subtle')).toBe(true);
    expect(active?.querySelector('[aria-hidden="true"]')?.classList.contains('opacity-100')).toBe(true);
  });

  it('should focus the mobile close button and close with Escape, overlay, and route selection', async () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.Dashboard.View]);
    const fixture = TestBed.createComponent(SidebarComponent);
    const close = vi.spyOn(fixture.componentInstance.closeRequested, 'emit');
    fixture.componentRef.setInput('mobileOpen', true);
    fixture.detectChanges();
    await Promise.resolve();

    const element = fixture.nativeElement as HTMLElement;
    expect(document.activeElement).toBe(element.querySelector('[aria-label="Close navigation"]'));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    element.querySelector<HTMLButtonElement>('[aria-label="Close navigation overlay"]')?.click();
    element.querySelector<HTMLAnchorElement>('a[href="/dashboard"]')?.click();
    expect(close).toHaveBeenCalledTimes(3);
  });
});
