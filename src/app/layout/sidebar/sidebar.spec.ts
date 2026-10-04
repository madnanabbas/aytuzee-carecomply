import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { resolveNavigationIcon } from '../../core/navigation/navigation-icon-resolver';
import { NavigationGroup, NavigationLoadStatus } from '../../core/navigation/navigation.models';
import { NavigationService } from '../../core/navigation/navigation.service';
import { SidebarComponent } from './sidebar';

@Component({ template: '' })
class EmptyRouteComponent {}

describe('SidebarComponent', () => {
  const groups = signal<readonly NavigationGroup[]>([]);
  const status = signal<NavigationLoadStatus>('loaded');

  beforeEach(() => {
    groups.set([]);
    status.set('loaded');
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: EmptyRouteComponent },
          { path: 'employees', component: EmptyRouteComponent },
        ]),
        { provide: NavigationService, useValue: { groups, status } },
      ],
    });
  });

  it('should use the official logo and hide unauthorized navigation', () => {
    groups.set([group('people', 'People', [item('employees', 'Employees', '/employees')])]);
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const copy = element.textContent ?? '';

    expect(element.querySelector('img[alt="Aytuzee Care Comply"]')?.getAttribute('src')).toBe(
      '/images/logo-light.png',
    );
    expect(copy).toContain('Employees');
    expect(copy).not.toContain('Clients');
    expect(copy).not.toContain('Access & Permissions');
  });

  it('should set aria-current and the restrained indicator on the active route', async () => {
    groups.set([
      group('overview', 'Overview', [
        item('dashboard', 'Dashboard', '/dashboard'),
        item('employees', 'Employees', '/employees'),
      ]),
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
    expect(active?.classList.contains('bg-white/15')).toBe(true);
    expect(active?.querySelector('[aria-hidden="true"]')?.classList.contains('opacity-100')).toBe(
      true,
    );
  });

  it('should focus the mobile close button and close with Escape, overlay, and route selection', async () => {
    groups.set([group('overview', 'Overview', [item('dashboard', 'Dashboard', '/dashboard')])]);
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

  it('should preserve nested navigation and collapse behavior', () => {
    groups.set([
      group('administration', 'Administration', [
        {
          ...item('access-management', 'Access Management', '/access-control'),
          children: [item('users', 'Users', '/access-control/users')],
        },
      ]),
    ]);
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    fixture.componentInstance.toggleModule('access-management');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Users');

    fixture.componentInstance.toggleCollapsed();
    expect(fixture.componentInstance.collapsed()).toBe(true);
  });

  it('should show a safe failure message without fallback links', () => {
    status.set('error');
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Navigation unavailable');
    expect(element.querySelectorAll('nav a')).toHaveLength(0);
  });
});

function group(key: string, label: string, items: NavigationGroup['items']): NavigationGroup {
  return { key, label, sortOrder: 10, items };
}

function item(id: string, label: string, route: string): NavigationGroup['items'][number] {
  return {
    id,
    label,
    route,
    icon: resolveNavigationIcon(id),
    sortOrder: 10,
    children: [],
  };
}
