import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthorizationService } from '../authorization/authorization.service';
import { Permissions } from '../authorization/permissions';
import { permissionGuard } from './permission-guard';

describe('permissionGuard', () => {
  let authorization: AuthorizationService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    authorization = TestBed.inject(AuthorizationService);
    router = TestBed.inject(Router);
  });

  it('should allow authorized access', () => {
    authorization.setPermissions([Permissions.Client.View]);

    expect(runGuard({ permissions: [Permissions.Client.View] })).toBe(true);
  });

  it('should allow access when any typed permission requirement is present', () => {
    authorization.setPermissions([Permissions.EmployeeDocument.View]);

    expect(
      runGuard({
        permissions: [Permissions.ClientDocument.View, Permissions.EmployeeDocument.View],
      }),
    ).toBe(true);
  });

  it('should return a forbidden UrlTree for unauthorized access', () => {
    expectForbidden(runGuard({ permissions: [Permissions.Client.View] }));
  });

  it('should fail closed when permission metadata is missing', () => {
    expectForbidden(runGuard({}));
  });

  it('should fail closed when permission metadata is invalid', () => {
    expectForbidden(runGuard({ permissions: ['Client.Delete'] }));
  });

  it('should fail closed for an empty permissions requirement', () => {
    expectForbidden(runGuard({ permissions: [] }));
  });

  function runGuard(data: Record<string, unknown>) {
    const route = { data } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() => permissionGuard(route, state));
  }

  function expectForbidden(result: unknown): void {
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/forbidden');
  }
});
