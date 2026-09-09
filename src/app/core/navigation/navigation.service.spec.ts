import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthorizationService } from '../authorization/authorization.service';
import { Permissions } from '../authorization/permissions';
import { NavigationApiService } from './navigation-api.service';
import { resolveNavigationIcon } from './navigation-icon-resolver';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  const api = { getNavigation: vi.fn() };

  beforeEach(() => {
    api.getNavigation.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: NavigationApiService, useValue: api }],
    });
  });

  it('renders ordered backend groups, nested access management, and caches per session', async () => {
    TestBed.inject(AuthorizationService).setPermissions([
      Permissions.Dashboard.View,
      Permissions.User.View,
    ]);
    api.getNavigation.mockReturnValue(of([
      module('administration', 'Administration', 20, [
        feature('access-management', 'Access Management', '/access-control', 10, [
          feature('users', 'Users', '/access-control/users', 10),
        ]),
      ]),
      module('overview', 'Overview', 10, [
        feature('dashboard', 'Dashboard', '/dashboard', 10),
      ]),
    ]));
    const navigation = TestBed.inject(NavigationService);

    await navigation.loadForSession('user-1');
    await navigation.loadForSession('user-1');

    expect(api.getNavigation).toHaveBeenCalledOnce();
    expect(navigation.groups().map((group) => group.label)).toEqual([
      'Overview', 'Administration',
    ]);
    expect(navigation.groups()[1]?.items[0]?.children[0]?.label).toBe('Users');
    expect(navigation.firstAllowedPath()).toBe('/dashboard');
    expect(navigation.findByUrl('/access-control/users/record')?.label).toBe('Users');
  });

  it('fails closed for unauthorized, unregistered, and unsafe route metadata', async () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.Dashboard.View]);
    api.getNavigation.mockReturnValue(of([
      module('overview', 'Overview', 10, [
        feature('dashboard', 'Dashboard', '/dashboard', 10),
        feature('clients', 'Clients', '/clients', 20),
        feature('unknown', 'Unknown', '/unknown', 30),
        feature('unsafe', 'Unsafe', 'javascript:alert(1)', 40),
      ]),
    ]));
    const navigation = TestBed.inject(NavigationService);

    await navigation.loadForSession('user-1');

    expect(navigation.groups()[0]?.items.map((item) => item.id)).toEqual(['dashboard']);
  });

  it('renders Companies when the API returns it for a user with Company.View', async () => {
    TestBed.inject(AuthorizationService).setPermissions([Permissions.Company.View]);
    api.getNavigation.mockReturnValue(of([
      module('administration', 'Administration', 20, [
        feature('companies', 'Companies', '/access-control/companies', 5),
      ]),
    ]));
    const navigation = TestBed.inject(NavigationService);

    await navigation.loadForSession('user-1');

    expect(navigation.groups()[0]?.items[0]?.label).toBe('Companies');
    expect(navigation.groups()[0]?.items[0]?.route).toBe('/access-control/companies');
  });

  it('uses a safe fallback icon and exposes a minimal failure state', async () => {
    expect(resolveNavigationIcon('not-registered')).toBeTruthy();
    api.getNavigation.mockReturnValue(throwError(() => new Error('offline')));
    const navigation = TestBed.inject(NavigationService);

    await navigation.loadForSession('user-1');

    expect(navigation.status()).toBe('error');
    expect(navigation.groups()).toEqual([]);
    expect(navigation.firstAllowedPath()).toBe('/forbidden');
  });
});

function module(key: string, name: string, sortOrder: number, features: readonly object[]) {
  return { key, name, sortOrder, features };
}

function feature(
  key: string,
  name: string,
  route: string,
  sortOrder: number,
  children: readonly object[] = [],
) {
  return { key, name, route, iconKey: 'not-registered', sortOrder, children };
}
